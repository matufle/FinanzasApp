# Deploy

Qwak en producción son tres servicios, cada uno gratis o casi:

| Pieza | Dónde | Qué se sube |
|---|---|---|
| Base de datos | **Supabase** | nada: es Postgres administrado |
| Api | **Google Cloud Run** | el contenedor del `Dockerfile` de la raíz |
| Frontend | **Vercel** | el build estático de `frontend/` |

Más un cuarto que no se deploya pero hay que tocar: **Google Cloud Console**, donde
viven las credenciales de OAuth ([`autenticacion.md`](autenticacion.md)).

El orden importa, porque cada paso necesita un dato del anterior: base → Api →
frontend → y al final volver a atar los cabos (CORS y orígenes de OAuth), que son
los dos que solo se pueden completar cuando ya existe el dominio del frontend.

## Antes de empezar

- Una cuenta de Google **con facturación habilitada**. Cloud Run pide tarjeta aunque
  el uso caiga dentro de la capa gratuita; sin cuenta de facturación no deja crear
  el servicio.
- Una cuenta en [Supabase](https://supabase.com) y otra en [Vercel](https://vercel.com).
- El [SDK de gcloud](https://cloud.google.com/sdk/docs/install) instalado. Alternativa
  sin instalar nada: abrir [Cloud Shell](https://shell.cloud.google.com) desde el
  navegador y clonar el repo ahí; ya viene con `gcloud` y `git`.
- Docker **no** hace falta: Cloud Run compila el `Dockerfile` en la nube con Cloud
  Build. Tenerlo sirve para probar la imagen localmente antes de subirla.

---

## 1. La base en Supabase

1. Crear un proyecto. Región **South America (São Paulo)**, que es la más cerca.

   **Esta elección se paga después y no se puede cambiar**: Supabase no mueve un
   proyecto de región, hay que rehacerlo. Y lo que importa no es solo la distancia a
   Argentina, sino que la base quede **en la misma región que Cloud Run** (paso 2.4):
   cada pedido a la Api dispara varias consultas, así que una base en Oregon con la
   Api en São Paulo hace cruzar el continente varias veces por pantalla. Si ya está
   creada en otra región, o se rehace, o se deploya la Api al lado de ella.
2. Anotar la contraseña de la base en el momento: Supabase no la vuelve a mostrar.
3. Botón **Connect** arriba → **Session pooler**. Copiar esa URL, que tiene esta
   forma:

   ```
   postgresql://postgres.<ref>:<clave>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   ```

Hay tres formas de conectarse a Supabase y solo una sirve acá, así que conviene
tenerlas claras:

| Opción | Host | Puerto | Sirve |
|---|---|---|---|
| Conexión directa | `db.<ref>.supabase.co` | 5432 | **No.** Es solo IPv6 y Cloud Run sale por IPv4: el contenedor no llega ni a conectarse |
| Pooler en modo transacción | `...pooler.supabase.com` | 6543 | **No.** Ver abajo |
| **Pooler en modo sesión** | `...pooler.supabase.com` | **5432** | **Sí** |

**Por qué no el modo transacción, que es el que Supabase muestra primero.** Probado
contra esta app: con el puerto 6543 el contenedor arranca, ejecuta la primera
consulta y después se cuelga sin error ni excepción, hasta que Cloud Run lo mata por
no responder. Pasa igual con la base vacía y con la base ya migrada, así que no es
cosa de las migraciones. Con el mismo contenedor y la misma base en el puerto 5432
arranca, migra, siembra las categorías y contesta. El modo transacción está pensado
para funciones serverless que abren y cierran una conexión por invocación; esto es un
proceso de larga vida con su propio pool adentro, que es justo lo que el modo sesión
espera.

Como el modo sesión sí ocupa una conexión real por cada conexión del pool, la Api
limita el suyo a diez por instancia (`CadenaConexion.cs`). Con el techo de tres
instancias son treinta como máximo, muy por debajo del límite del plan gratis.

Si la contraseña tiene `@`, `/`, `:` o `#`, hay que escribirla *url-encodeada*
dentro de la URL (`@` es `%40`), porque si no corta la URL en el lugar equivocado.

**Las migraciones no se corren a mano.** La Api las aplica sola al arrancar
(`PrepararBaseAsync` en `Program.cs`) y, si no hay ninguna categoría, siembra las
típicas. La primera vez que Cloud Run levante el contenedor, la base queda armada.

---

## 2. La Api en Cloud Run

### 2.1 Preparar el proyecto

```bash
gcloud auth login
gcloud config set project <id-del-proyecto>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Conviene usar **el mismo proyecto** donde ya están las credenciales de OAuth, así
queda todo junto.

### 2.2 Generar la clave de firma

Es la clave con la que la Api firma sus propios tokens. Tiene que tener al menos 32
caracteres y no sale de ningún lado: se inventa una y se guarda.

```bash
openssl rand -base64 48
```

Si se cambia, todas las sesiones abiertas se caen. No es grave, pero tampoco es para
andar rotándola sin motivo.

### 2.3 Deploy

Desde la raíz del repositorio:

```bash
gcloud run deploy qwak-api --source . --region southamerica-east1 --allow-unauthenticated --max-instances 3 --cpu-boost --set-env-vars "DATABASE_URL=postgresql://postgres.REF:CLAVE@aws-0-sa-east-1.pooler.supabase.com:5432/postgres,Autenticacion__GoogleClientId=XXXX.apps.googleusercontent.com,Autenticacion__EmailsPermitidos__0=tu-mail@gmail.com,Autenticacion__ClaveFirma=LA-CLAVE-GENERADA"
```

Qué hace cada parte:

| Bandera | Por qué |
|---|---|
| `--source .` | compila el `Dockerfile` de la raíz en la nube; no hay que buildear ni pushear a mano |
| `--allow-unauthenticated` | deja que cualquiera **llegue** al servicio. Quién puede entrar lo decide el login de la Api, no IAM |
| `--max-instances 3` | techo de gasto: aunque algo se descontrole, no puede escalar a cien contenedores |
| `--cpu-boost` | más CPU durante el arranque; recorta bastante el arranque en frío |

Y dos cosas que **no** hay que poner:

- **`ASPNETCORE_ENVIRONMENT`**: sin esa variable .NET asume `Production`, que es
  justo lo que queremos. En `Development` la Api publica la documentación de Scalar
  y el endpoint `/api/auth/desarrollo`, que entra sin Google.
- **`PORT`**: la pone Cloud Run sola, y `Program.cs` la lee.

Si alguno de los valores tiene una coma, `--set-env-vars` la interpreta como
separador entre variables. Para esos casos se cambia el separador declarándolo al
principio del string: `--set-env-vars "^##^CLAVE1=valor,con,comas##CLAVE2=otro"`.

El primer deploy tarda unos minutos, porque compila la imagen. Al final imprime la
URL, del estilo `https://qwak-api-xxxxxxxx.southamerica-east1.run.app`. Probarla:

```bash
curl https://qwak-api-xxxxxxxx.southamerica-east1.run.app/
```

Tiene que contestar `{"servicio":"FinanzasApp","estado":"ok"}`. Si contesta eso, la
base también anduvo: la Api no llega a escuchar si las migraciones fallan.

### 2.4 Región y latencia

`southamerica-east1` (São Paulo) es la más cercana a Argentina: unos 30 ms contra los
~130 ms de las regiones de Estados Unidos. La contra es que está en el nivel de
precios más caro de Google. Mientras el consumo caiga dentro de la capa gratuita da
lo mismo; si algún día deja de caer, `us-central1` es la alternativa barata.

Lo que **no** es opcional es que esta región y la de Supabase estén juntas. Entre el
navegador y la Api hay un viaje por pantalla; entre la Api y la base hay varios. Si
la base quedó en `us-west-2`, la Api va a `us-west1` y no a São Paulo.

---

## 3. El frontend en Vercel

1. **Add New → Project**, importar el repositorio.
2. **Root Directory: `frontend`**. Es el único ajuste manual; el resto lo detecta
   solo (Vite → `npm run build` → `dist`).
3. Variables de entorno del proyecto:

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | la URL de Cloud Run, sin barra final |
   | `VITE_GOOGLE_CLIENT_ID` | el Client ID de OAuth |

4. Deploy.

**Las variables de Vite se hornean en el build**, no se leen en tiempo de ejecución:
cambiar cualquiera de las dos obliga a un redeploy para que tenga efecto.

El `frontend/vercel.json` ya está en el repo. Lo único que hace es mandar todas las
rutas a `index.html`, porque la app usa rutas de verdad (`/movimientos`,
`/metricas`) y sin eso entrar directo a una, o apretar F5 estando ahí, daría 404.

---

## 4. Dominio propio en Cloudflare (opcional)

Se puede saltear entero: con `TU-PROYECTO.vercel.app` la app funciona igual. Pero si
ya tenés un dominio, **conviene hacerlo acá y no después**, porque el dominio del
frontend aparece en los dos pasos que siguen (CORS y orígenes de OAuth) y si lo
cambiás más tarde hay que volver a tocar ambos.

### 4.1 Antes: mirar qué tenés y qué estás pagando

En el panel de Cloudflare, **Domain Registration → Manage Domains**: ahí está la
fecha de renovación y el interruptor de auto-renovación. La facturación del registrar
va separada del resto de Cloudflare, así que conviene mirar también **Billing →
Subscriptions**.

Dos cosas que funcionan distinto a todo lo demás de esta guía:

- Un dominio **se cobra por año**, no por mes, y Cloudflare lo vende a precio de
  costo (alrededor de diez dólares anuales para un `.com`).
- No se "borra" para dejar de pagarlo: se **apaga la auto-renovación** y se lo deja
  vencer. Borrarlo antes no devuelve la plata de los meses ya pagados.

Aparte: el **Email Routing** de Cloudflare (reenviar `hola@tudominio.com` a tu Gmail)
es gratis. Cloudflare no manda mails; si en algún proyecto mandabas mails de verdad,
había otro proveedor en el medio (Resend, Mailgun, SendGrid) y ese es el que puede
estar cobrando aparte.

### 4.2 El frontend en `qwak.tudominio.com`

1. En Vercel: **Project → Settings → Domains → Add**, escribir `qwak.tudominio.com`.
   Vercel va a pedir un registro CNAME apuntando a `cname.vercel-dns.com`.
2. En Cloudflare: **DNS → Records → Add record**.

   | Campo | Valor |
   |---|---|
   | Type | `CNAME` |
   | Name | `qwak` |
   | Target | `cname.vercel-dns.com` |
   | Proxy status | **DNS only** (la nube **gris**) |

3. Esperar un minuto y refrescar la pantalla de Vercel hasta que el dominio quede en
   verde. El certificado lo emite Vercel solo.

**Lo de la nube gris es el punto que hace fallar esto.** Si se deja el proxy naranja
encendido, Vercel no puede validar el dominio ni emitir el certificado, y además el
modo SSL *Flexible* de Cloudflare produce redirecciones infinitas contra un backend
que ya sirve HTTPS. Si por algún motivo querés el proxy encendido, en **SSL/TLS** el
modo tiene que ser **Full (strict)**, nunca *Flexible*.

Para usar el dominio pelado (`tudominio.com` en vez de `qwak.tudominio.com`) el
registro va igual pero con Name `@`; Cloudflare resuelve solo el hecho de que un
CNAME en la raíz no sea válido en DNS. Con un subdominio es más simple y deja la raíz
libre para tu portfolio.

### 4.3 La Api se queda en `run.app`

La recomendación es **no** ponerle dominio propio a la Api. Nadie ve esa URL —la usa
el frontend por dentro— y en Cloud Run el dominio propio no es un CNAME y listo: hay
que verificar la propiedad del dominio en Google y crear un *domain mapping*, que no
está disponible en todas las regiones. Todo ese trabajo para una URL que no mira
nadie.

Si algún día lo querés igual, es `gcloud beta run domain-mappings create` más la
verificación del dominio en Google Search Console.

---

## 5. Atar los cabos

Estos dos pasos solo se pueden hacer al final, porque necesitan el dominio del
frontend: el propio si hiciste el paso 4, o el de Vercel si no.

**CORS en la Api.** El navegador bloquea las llamadas a otro origen salvo que la Api
lo autorice:

```bash
gcloud run services update qwak-api --region southamerica-east1 --update-env-vars "Cors__OrigenesPermitidos__0=https://TU-PROYECTO.vercel.app"
```

Sin barra final y con `https`. Actualizar variables crea una revisión nueva sola, no
hace falta volver a deployar.

Si usás dominio propio conviene dejar los dos orígenes, porque el `.vercel.app` sigue
respondiendo y sirve para probar sin tocar el DNS. Se agrega un índice más:
`Cors__OrigenesPermitidos__1=https://TU-PROYECTO.vercel.app`.

**Orígenes de OAuth.** En Google Cloud Console → APIs y servicios → Credenciales → el
ID de cliente → **Orígenes autorizados de JavaScript**, agregar
`https://TU-PROYECTO.vercel.app` al lado del `http://localhost:5173` que ya está. Sin
esto el botón de Google no abre el popup. Los cambios pueden tardar unos minutos en
propagarse.

---

## 6. Verificación

- [ ] `GET /` de la Api contesta `estado: ok`.
- [ ] `GET /api/cuentas` sin token contesta **401**.
- [ ] El frontend abre y muestra la cortina del logo y después el login.
- [ ] El botón de Google abre el popup y entra.
- [ ] Una cuenta de Google que **no** esté en `EmailsPermitidos` rebota.
- [ ] Cargar un movimiento, refrescar la página y que siga ahí.
- [ ] Lo mismo desde el celular.

---

## 7. Qué cuesta y qué límites tiene

| Servicio | Plan | Límite real |
|---|---|---|
| Supabase | Free | 500 MB de base, y **pausa el proyecto a los 7 días sin ninguna conexión** |
| Cloud Run | Pago por uso, con capa gratuita mensual | escala a cero: sin pedidos no factura |
| Vercel | Hobby o Pro | el Hobby no permite uso comercial |

Los números exactos de la capa gratuita de Cloud Run cambian cada tanto, así que lo
que conviene entender es el mecanismo: se factura por tiempo de CPU y memoria
**mientras atiende pedidos**, más un cargo por millón de pedidos. Con
`--min-instances 0` (el valor por defecto), una app que usa una persona pasa el 99%
del mes apagada y factura prácticamente nada. Lo que sí cuesta es poner
`--min-instances 1` para evitar el arranque en frío: eso es tener un contenedor
prendido siempre.

Ese es el compromiso: unos segundos de espera la primera vez del día, o unos dólares
por mes para que no los haya.

**Sobre escalar a mucha gente:** el cuello de botella no va a ser Cloud Run, que
levanta instancias solo (y el `--max-instances 3` está justamente para que no lo haga
sin control). Van a apretar antes los 500 MB de Supabase y, sobre todo, el modelo de
datos: hoy Qwak es de un solo dueño, porque `EmailsPermitidos` es la lista de quién
puede entrar a *esta* instalación y no una tabla de usuarios. Para que la use más
gente falta la fase 6 del [roadmap](roadmap.md). La buena noticia es que nada de esto
ata: lo que se sube es un contenedor común, y mudarlo es correr un `deploy` en otro
lado.

---

## 8. Actualizar

- **Frontend**: cada push a la rama conectada dispara un deploy solo.
- **Api**: volver a correr el `gcloud run deploy --source .` de arriba. Las variables
  de entorno ya cargadas se mantienen.

---

## 9. Endurecer (opcional)

`DATABASE_URL` y `Autenticacion__ClaveFirma` son secretos y, como variables de
entorno, quedan a la vista de cualquiera que entre a la consola del proyecto. Si el
proyecto es solo tuyo alcanza; si algún día lo comparte más gente, conviene moverlos
a Secret Manager:

```bash
gcloud secrets create qwak-clave-firma --data-file=-
gcloud run services update qwak-api --region southamerica-east1 --update-secrets "Autenticacion__ClaveFirma=qwak-clave-firma:latest"
```

(El primer comando lee el valor de la entrada estándar, así que se pega la clave y se
cierra con Ctrl+D.) Cloud Run necesita que la cuenta de servicio del servicio tenga
el permiso `secretmanager.secretAccessor`; la consola ofrece dárselo cuando detecta
que falta.

---

## 10. Problemas comunes

| Síntoma | Causa |
|---|---|
| El deploy termina en error y la revisión no toma tráfico | la Api no llegó a escuchar. Casi siempre es la base: `gcloud run services logs read qwak-api --region southamerica-east1` |
| `Falta la cadena de conexion` en los logs | no llegó `DATABASE_URL` |
| `Network is unreachable` conectando a Postgres | se usó la conexión directa de Supabase (IPv6) en vez del pooler |
| El contenedor arranca, no tira ningún error y Cloud Run lo mata por no responder | la URL apunta al pooler en modo transacción (6543). Tiene que ser el modo sesión (5432) |
| El navegador dice *blocked by CORS policy* | el dominio de `Cors__OrigenesPermitidos__0` no coincide exacto: sobra una barra final, o dice `http` donde va `https` |
| Todo devuelve 401 | venció el token (30 días) o se cambió `ClaveFirma`. Se arregla volviendo a entrar |
| El botón de Google no abre nada | falta el dominio en **Orígenes autorizados de JavaScript** |
| Vercel no valida el dominio propio, o el sitio entra en un bucle de redirecciones | el registro de Cloudflare quedó con el proxy naranja encendido. Tiene que estar en **DNS only** |
| Todo anda pero se siente lento en cada pantalla | la Api y la base quedaron en regiones distintas |
| La primera carga del día tarda varios segundos | arranque en frío de Cloud Run, más el despertar de Supabase si estuvo quieta |
| Anduvo una semana y de golpe nada | Supabase pausa el proyecto a los 7 días sin conexiones. Se despausa desde el panel |
| Google corta con `401 invalid_client` antes de pedir la cuenta | el `VITE_GOOGLE_CLIENT_ID` cargado en Vercel no coincide con un cliente real. Ver *Problemas comunes* en [`autenticacion.md`](autenticacion.md) |
| Se corrigió una variable en Vercel y sigue igual | el redeploy reusó el cache de build. Hay que destildar **Use existing Build Cache** |
