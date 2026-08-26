# Notificaciones

Qwak manda un recordatorio a la noche cuando el día pasó sin que se cargara ningún
movimiento. Llega al celular y a la computadora aunque la app esté cerrada, y con un
toque abre la pantalla de cargar.

Es lo mínimo de la fase 5 del [roadmap](roadmap.md). Los avisos de presupuestos, de
gastos recurrentes y el resumen semanal se apoyan en lo mismo que hay acá.

---

## Cómo funciona

Son cuatro piezas y ninguna es un servicio pago:

1. **El navegador** se suscribe a su propio servicio push (Google para Chrome,
   Mozilla para Firefox, Apple para Safari) y devuelve una URL de entrega —el
   *endpoint*— más un par de claves.
2. **La Api** guarda esa suscripción en la tabla `suscripciones_push`.
3. **Un programador de tareas externo** le pega a la Api todas las noches.
4. **La Api** mira si hubo altas hoy; si no hubo, le hace un POST firmado al endpoint
   de cada navegador suscripto.

El aviso viaja **sin contenido**: el texto lo pone el service worker
(`frontend/public/sw.js`), que siempre muestra el mismo recordatorio. Eso es lo que
permite que no haya ninguna librería de push en el proyecto —un aviso con datos
adentro hay que cifrarlo con ECDH y AES128-GCM— y deja el envío en un POST vacío con
una cabecera firmada. La firma es VAPID: un JWT ES256 que arma
`EnviadorPushWeb.FirmarToken`.

**Por qué el horario lo pone alguien de afuera.** Cloud Run apaga el contenedor
cuando no hay pedidos, así que un temporizador adentro del proceso no correría de
noche justamente porque de noche no hay nadie usando la app. Quien tiene el reloj es
Cloud Scheduler; la Api solo decide si corresponde avisar.

**Qué cuenta como "ya cargaste".** Cualquier movimiento **dado de alta hoy**, mire la
fecha que mire. Cargar hoy el gasto de ayer cuenta: la pregunta es si anotaste, no
qué anotaste.

---

## 1. Generar las claves VAPID

Identifican a este servidor ante Google, Mozilla y Apple. Se generan una vez y no se
tocan más: si cambian, todos los navegadores suscriptos dejan de recibir avisos y hay
que volver a activarlos.

Con la Api corriendo en desarrollo:

```bash
TOKEN=$(curl -s -X POST http://localhost:5199/api/auth/desarrollo -H "Content-Type: application/json" -d {} | jq -r .token)
```

```bash
curl -X POST http://localhost:5199/api/notificaciones/claves-nuevas -H "Authorization: Bearer $TOKEN"
```

Contesta un par `{ "publica": "...", "privada": "..." }`. Ese endpoint **solo existe
en `Development`**, porque devuelve una clave privada por HTTP, y como todo lo que
cuelga de `/api/notificaciones` exige sesión: de ahí el token de desarrollo del paso
anterior.

Hace falta además una clave más, la que protege el endpoint del recordatorio. Esa se
inventa:

```bash
openssl rand -base64 32
```

---

## 2. Configurar la Api

Cuatro variables de entorno:

| Variable | Qué es |
|---|---|
| `Push__ClavePublica` | la pública del par VAPID; también viaja al navegador |
| `Push__ClavePrivada` | la privada del par VAPID; **secreta** |
| `Push__ClaveRecordatorio` | el secreto que tiene que mandar el programador de tareas |
| `Push__DesfasajeHoras` | diferencia contra UTC para saber dónde empieza y termina "hoy". `-3` para Argentina |
| `Push__Contacto` | un `mailto:` tuyo, que es lo que el estándar pide para poder avisarte si algo anda mal con los envíos. El del código es un marcador: el repositorio es público |

En desarrollo van con user-secrets, desde `src/FinanzasApp.Api`. **Ojo con el
separador**: acá las claves anidan con dos puntos, no con doble guión bajo. El `__`
lo traduce a `:` el proveedor de variables de entorno, y user-secrets es un JSON, así
que `Push__ClavePublica` quedaría como una clave suelta que no se ata a la sección
`Push` y la Api se comporta como si no estuviera configurada:

```bash
dotnet user-secrets set "Push:ClavePublica" "B..."
dotnet user-secrets set "Push:ClavePrivada" "..."
dotnet user-secrets set "Push:ClaveRecordatorio" "..."
dotnet user-secrets set "Push:DesfasajeHoras" "-3"
```

Para verificar que quedaron bien, `GET /api/notificaciones/clave-publica` tiene que
contestar `habilitado: true`.

En producción, sobre el servicio que ya está andando:

```bash
gcloud run services update qwak-api --region southamerica-east1 --update-env-vars "Push__ClavePublica=B...,Push__ClavePrivada=...,Push__ClaveRecordatorio=...,Push__DesfasajeHoras=-3"
```

Sin las dos claves VAPID la app no rompe: Ajustes muestra el recordatorio en gris con
un cartel de que el servidor todavía no lo tiene configurado.

---

## 3. Programar el aviso de la noche

Cloud Scheduler, en la misma cuenta de Google que Cloud Run. El plan gratis da tres
tareas por mes y acá se usa una.

```bash
gcloud scheduler jobs create http qwak-recordatorio --location southamerica-east1 --schedule "0 21 * * *" --time-zone "America/Argentina/Buenos_Aires" --uri "https://qwak-api-XXXX.southamerica-east1.run.app/api/notificaciones/recordatorio-diario" --http-method POST --headers "X-Qwak-Recordatorio=LA-CLAVE-DEL-RECORDATORIO"
```

`0 21 * * *` son las nueve de la noche, todos los días. La hora se elige acá y no en
el código: cambiarla es correr `gcloud scheduler jobs update http` con otro
`--schedule`.

Para probarlo sin esperar a la noche:

```bash
gcloud scheduler jobs run qwak-recordatorio --location southamerica-east1
```

La respuesta del endpoint dice qué pasó:

```json
{ "salteado": true, "motivo": "Ya se cargaron movimientos hoy.", "enviadas": 0, "vencidas": 0, "fallidas": 0 }
```

---

## 4. Activarlo en cada dispositivo

En **Ajustes → Recordatorio diario**, con el interruptor. El navegador pide permiso y
queda suscripto.

La suscripción es **por navegador, no por cuenta**: hay que prenderlo en el celular y
en la computadora por separado. El botón **Probar** manda el aviso en el momento, que
es la única forma honesta de saber si el permiso, la suscripción y las claves del
servidor están todos bien.

En iPhone y iPad hay una condición más: los avisos solo llegan si la app está
**instalada** desde Safari (Compartir → Agregar a inicio). En el navegador a secas,
iOS no los entrega.

---

## Problemas comunes

**El interruptor está en gris y dice que el servidor no está configurado.** Faltan la
clave pública o la privada. En desarrollo, el motivo más habitual es haberlas cargado
en user-secrets con `__` en vez de `:`: se guardan sin error y no se atan a la sección
`Push`. `GET /api/notificaciones/clave-publica` lo dice enseguida.

**El interruptor no se deja prender y dice que está bloqueado.** El permiso de
notificaciones se rechazó alguna vez para este sitio. Se cambia desde el candado de
la barra de direcciones, no desde la app.

**Probar dice que salió pero no llega nada.** Mirar los logs de la Api: si el servicio
push contestó un error, queda escrito ahí con el código. Un `403` casi siempre es que
la clave pública configurada en la Api no es la misma con la que el navegador se
suscribió; en ese caso hay que apagar y volver a prender el recordatorio.

**Andaba y dejó de andar en un dispositivo.** Las suscripciones vencen solas cuando se
limpian los datos del sitio o se reinstala el navegador. La Api las borra en cuanto el
servicio push contesta `404` o `410`, así que alcanza con volver a prender el
interruptor ahí.

**Llegan avisos aunque hayas cargado movimientos.** Revisar `Push__DesfasajeHoras`: si
quedó en 0, la Api piensa que el día arranca a las 21 hora argentina.
