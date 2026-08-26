# Autenticación con Google

Qwak es de una sola persona. La autenticación tiene dos capas: primero Google
verifica **quién sos**, y después Qwak verifica que ese quién esté en su lista de
emails permitidos. Cualquier otra cuenta de Google entra a Google sin problema y
rebota acá.

## Cómo funciona

```
Navegador  --(1)-->  Google           el usuario elige su cuenta
Navegador  <--(2)--  Google           ID token firmado por Google (dura 1 hora)
Navegador  --(3)-->  Api /api/auth/google
                     Api verifica la firma contra las claves públicas de Google,
                     que el token sea para NUESTRO Client ID, que el email esté
                     verificado y que esté en EmailsPermitidos
Navegador  <--(4)--  Api              token propio de Qwak (dura 30 días)
Navegador  --(5)-->  Api /api/...     Authorization: Bearer <token de Qwak>
```

**Por qué un token propio y no el de Google:** el ID token de Google vence en una
hora. En el celular eso significa volver a loguearse todo el tiempo, que es
exactamente lo que hace que una app de finanzas se abandone. El token de Qwak dura
30 días (`Autenticacion:DiasDeSesion`).

Todo esto vive en la capa Api (`src/FinanzasApp.Api/Autenticacion/`). Domain,
Application e Infrastructure no saben que existe el login.

## Crear las credenciales en Google

1. Entrar a [Google Cloud Console](https://console.cloud.google.com/) y crear un
   proyecto (por ejemplo, "Qwak").
2. **APIs y servicios → Pantalla de consentimiento de OAuth**. Tipo de usuario
   **Externo**. Completar nombre de la app, email de asistencia y email de
   contacto. Después **publicarla** ("En producción"): como Qwak solo pide los
   permisos básicos (`openid`, `email`, `profile`), es instantáneo y no hay
   revisión de Google. Ver la nota sobre costo más abajo.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de
   OAuth**, tipo **Aplicación web**.
4. En **Orígenes autorizados de JavaScript** poner los dominios desde donde se
   abre el frontend. Van sin barra final:
   - `http://localhost:5173` (desarrollo)
   - el dominio del frontend en producción, cuando exista
5. **Orígenes**, no "URIs de redireccionamiento": este flujo no usa redirect, así
   que ese campo puede quedar vacío.
6. Copiar el **ID de cliente**. Termina en `.apps.googleusercontent.com`.

El *Client Secret* que también aparece **no se usa** en este flujo y no hay que
ponerlo en ningún lado.

### Esto no cuesta nada ni vence

Iniciar sesión con Google es gratis y no tiene vencimiento: no pide tarjeta, no
necesita cuenta de facturación y no cobra por usuario ni por login. El crédito de
USD 300 por 90 días de Google Cloud es otra cosa — es para servicios pagos como
máquinas virtuales o bases de datos, y este flujo no toca ninguno. Tampoco hay
Firebase de por medio, que sí tiene planes pagos.

Lo único que tiene un límite real es la pantalla de consentimiento en estado
*Testing*: tope de 100 usuarios de prueba, y Google vence los *refresh tokens* a
los 7 días. Lo segundo no nos afecta (este flujo no usa refresh tokens en ningún
momento: el ID token se canjea una sola vez por el token propio de Qwak), pero
publicar la pantalla saca el tema de encima del todo.

## Configurar la Api

Tres valores, ninguno de los cuales va al repositorio.

| Clave | Qué es |
|---|---|
| `Autenticacion:GoogleClientId` | El ID de cliente del paso anterior. |
| `Autenticacion:EmailsPermitidos` | Lista de emails que pueden entrar. |
| `Autenticacion:ClaveFirma` | Clave con la que Qwak firma su propio token. Mínimo 32 caracteres, al azar. |

En desarrollo, con user-secrets:

```bash
dotnet user-secrets set "Autenticacion:GoogleClientId" "TU-ID.apps.googleusercontent.com" --project src/FinanzasApp.Api
```

```bash
dotnet user-secrets set "Autenticacion:EmailsPermitidos:0" "tuemail@gmail.com" --project src/FinanzasApp.Api
```

```bash
dotnet user-secrets set "Autenticacion:ClaveFirma" "$(openssl rand -base64 48)" --project src/FinanzasApp.Api
```

En producción, por variables de entorno (el doble guion bajo reemplaza a los dos
puntos):

```
Autenticacion__GoogleClientId=TU-ID.apps.googleusercontent.com
Autenticacion__EmailsPermitidos__0=tuemail@gmail.com
Autenticacion__ClaveFirma=<48 bytes al azar en base64>
```

Si alguno falta, la Api **no arranca** en producción y dice cuál falta. Es a
propósito: arrancar sin `EmailsPermitidos` sería dejar la puerta abierta o, peor,
dejarla cerrada para todos sin que se note hasta el primer login.

**Ojo con `ClaveFirma`:** si cambia, todas las sesiones abiertas se caen. Es lo
que hay que hacer si alguna vez se filtra.

## Configurar el frontend

Una sola variable, en `frontend/.env`:

```
VITE_GOOGLE_CLIENT_ID=TU-ID.apps.googleusercontent.com
```

Es el mismo valor que la Api, y no es secreto: identifica a la app ante Google y
viaja al navegador de todas formas.

## Modo desarrollo

Mientras `VITE_GOOGLE_CLIENT_ID` esté vacío, el login muestra un botón "Entrar en
modo desarrollo" que llama a `POST /api/auth/desarrollo` y devuelve una sesión de
un día sin pasar por Google.

Ese endpoint **solo se publica cuando la Api corre en `Development`**: en
producción no existe, ni siquiera devolviendo 401 — la ruta no está mapeada.

## Qué pasa cuando la sesión vence

La Api contesta 401. El cliente HTTP del frontend (`src/api/cliente.ts`) lo
detecta, borra el token guardado y dispara el evento `qwak:sesion-expirada`; el
contexto de sesión lo escucha, limpia el estado y `RutaProtegida` manda al login
recordando en qué pantalla estabas.

Los 401 de `/api/auth/*` se ignoran a propósito: ahí el 401 significa "esta cuenta
no tiene acceso", que es una respuesta esperada del login y no una sesión vencida.

## Problemas comunes

**"The given origin is not allowed for the given client ID"** en la consola del
navegador: el origen desde donde se abre el frontend no está en la lista del paso
4. Ojo con el puerto: si Vite arranca en 5174 porque 5173 estaba ocupado, ese
origen no está autorizado.

**El botón de Google no aparece:** la librería se baja de
`https://accounts.google.com/gsi/client` en caliente. Un bloqueador de anuncios o
falta de internet la frenan; el login muestra el error en pantalla.

**401 "Esta cuenta no tiene acceso a la aplicación":** el login con Google salió
bien pero el email no está en `EmailsPermitidos`. Los logs de la Api dicen con qué
email se intentó.

**401 `invalid_client` — "The OAuth client was not found"** en la pantalla de
Google, antes de llegar a elegir la cuenta: el Client ID que mandó el frontend no
existe en Google. Ojo que **no** es lo mismo que el error de orígenes: ahí el
cliente existe y lo que falla es desde dónde se lo llama.

La causa típica es un valor mal pegado en el entorno de producción (un dígito de
más en el número de proyecto, un espacio al final) o un cliente que se borró de
Google Cloud Console. Como las variables de Vite **se hornean en el build**, lo
que ve el navegador puede ser distinto de lo que dice tu `.env` local.

Para saber cuál se está mandando de verdad, sacalo del bundle publicado:

```bash
curl -s https://TU-DOMINIO/assets/$(curl -s https://TU-DOMINIO/ | grep -oE 'assets/index-[^"]+\.js' | head -1 | cut -d/ -f2) | grep -oE '[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com'
```

Y para saber si ese ID existe, sin abrir la consola de Google:

```bash
curl -sL "https://accounts.google.com/o/oauth2/v2/auth?client_id=EL-ID&redirect_uri=http://localhost:5173&response_type=code&scope=openid" | grep -oE 'invalid_client|redirect_uri_mismatch'
```

`redirect_uri_mismatch` significa que el cliente **existe** (ese chequeo no aplica
a este flujo, que no usa redirect). `invalid_client` significa que no existe.

**El botón se dibuja pero al tocarlo no pasa nada:** el diálogo de Google no llegó
a abrirse. Según el camino que haya tomado el botón, la consola dice
`[GSI_LOGGER]: Failed to open popup window… Maybe blocked by the browser?` (un
bloqueador de ventanas emergentes o una extensión de privacidad) o
`[GSI_LOGGER]: FedCM get() rejects with…` (no hay ninguna sesión de Google abierta
en el navegador, o el navegador tiene bloqueado el inicio de sesión de terceros).

La librería no avisa de ninguno de los dos: `error_callback` no se dispara y el
botón queda mudo. Por eso `avisarSiElLoginNoAbre`, en `auth/google.ts`, escucha
las dos señales que sí quedan —que `navigator.credentials.get()` rechace, o que
`window.open()` devuelva `null`— y el login muestra el aviso en pantalla. Los dos
casos se arreglan del lado de quien entra, no del servidor.

## FedCM

El botón se inicializa con `use_fedcm_for_button: true`. Con FedCM el diálogo de
elección de cuenta lo dibuja **el navegador**, no una ventana emergente de Google:
es el camino al que Google está migrando este flujo y, de paso, esquiva a los
bloqueadores de popups, que dejaban el botón sin abrir nada.

No hay que configurar nada en Google Cloud Console para usarlo, y donde el
navegador no lo soporte la librería vuelve sola al popup de siempre. Por eso el
aviso de "ventana bloqueada" sigue en pie: los dos caminos siguen vivos y los dos
pueden fallar.

Un detalle que se paga si se ignora: apenas se dibuja el botón, la librería
intenta FedCM **por su cuenta**, sin que nadie toque nada, y ese intento falla de
mil formas inocentes. Por eso el aviso sólo sale cuando la llamada nació de un
gesto real (`navigator.userActivation.isActive` durante el clic); si no, la
pantalla recién abierta mostraría un cartel de error sin motivo.
