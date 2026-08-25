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
   contacto. No hace falta publicarla: mientras esté en modo *Testing*, agregate
   a vos mismo en **Usuarios de prueba** y alcanza.
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
