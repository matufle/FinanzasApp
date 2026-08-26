# FinanzasApp

App de finanzas personales. Backend en .NET 10 con Clean Architecture y PostgreSQL.

## Estructura

```
src/
├── FinanzasApp.Domain          Entidades y reglas. No depende de nada.
├── FinanzasApp.Application     Casos de uso, DTOs e interfaces de repositorio.
├── FinanzasApp.Infrastructure  EF Core + PostgreSQL. Implementa las interfaces.
└── FinanzasApp.Api             Endpoints HTTP.
```

La dependencia va hacia adentro: Api → Application → Domain, e Infrastructure → Application.
Domain no conoce a nadie.

## Base de datos para desarrollo

PostgreSQL local en Docker, para no consumir cuota de servicios en la nube
mientras se desarrolla. Es el mismo motor que en producción.

```
docker compose up -d
```

La cadena de conexión local ya está guardada en los user-secrets del proyecto Api.
Para recrear la base desde cero (borra todos los datos):

```
docker compose down -v
docker compose up -d
dotnet ef database update --project src/FinanzasApp.Infrastructure --startup-project src/FinanzasApp.Api
```

## Base de datos en producción

Sirve cualquier PostgreSQL gestionado: Neon, Supabase, Railway o Render. Se configura
con la variable de entorno `DATABASE_URL`, que acepta tanto la URL que dan los
proveedores (`postgresql://usuario:clave@host/base`) como el formato Npgsql
(`Host=...;Username=...;Password=...`). La conversión es automática y no hay que
tocar código para cambiar de proveedor.

El proveedor elegido para este proyecto es **Supabase**, y el resto del deploy es
**Cloud Run** para la Api y **Vercel** para el frontend: [docs/deploy.md](docs/deploy.md).

## Aplicar las migraciones

La Api las aplica sola al arrancar, y si la tabla de categorías está vacía carga
las típicas (Sueldo, Supermercado, Alquiler…). No hace falta correr nada a mano,
ni en desarrollo ni en el deploy. El comando queda igual por si se necesita:

```
dotnet ef database update --project src/FinanzasApp.Infrastructure --startup-project src/FinanzasApp.Api
```

## Tests

```
dotnet test
```

`FinanzasApp.Application.Tests` prueba los servicios contra repositorios en
memoria (`Dobles/RepositoriosEnMemoria.cs`), sin base de datos: lo que se
verifica son las reglas y los cálculos, no EF Core.

## Levantar la API

```
dotnet run --project src/FinanzasApp.Api
```

Documentación interactiva en `/scalar/v1` (solo en Development).

## Endpoints

Todo `/api/*` exige sesión salvo los de login: sin un `Authorization: Bearer`
válido la respuesta es 401.

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/google` | Canjea el ID token de Google por el token de sesión. Público |
| GET | `/api/auth/yo` | Usuario de la sesión actual |
| POST | `/api/auth/desarrollo` | Sesión sin Google. Solo existe en Development |
| GET | `/api/cuentas` | Cuentas activas con saldo actual calculado |
| GET | `/api/cuentas/{id}` | Una cuenta con su saldo |
| POST | `/api/cuentas` | Crea una cuenta |
| DELETE | `/api/cuentas/{id}` | Baja lógica |
| GET | `/api/categorias?tipo=Ingreso\|Egreso` | Categorías activas |
| POST | `/api/categorias` | Crea una categoría |
| DELETE | `/api/categorias/{id}` | Baja lógica |
| GET | `/api/movimientos?desde&hasta&cuentaId` | Movimientos del rango (por defecto, mes actual) |
| POST | `/api/movimientos` | Registra un ingreso o egreso |
| DELETE | `/api/movimientos/{id}` | Anula un movimiento |
| GET | `/api/reportes/resumen?desde&hasta&cuentaId` | Totales y desglose por categoría |
| GET | `/api/reportes/metricas?anio&mes&cuentaId&meses` | Tasa de ahorro, comparativa contra el mes anterior, proyección a fin de mes, flujo de caja y top de egresos |
| GET | `/api/notificaciones/clave-publica` | Clave VAPID con la que el navegador se suscribe |
| POST | `/api/notificaciones/suscripciones` | Registra este navegador para recibir avisos |
| POST | `/api/notificaciones/suscripciones/baja` | Lo da de baja |
| POST | `/api/notificaciones/prueba` | Manda el aviso ahora, para probar que llega |
| POST | `/api/notificaciones/recordatorio-diario` | Avisa si hoy no se cargó nada. Lo llama el programador de tareas, no el navegador |

## Autenticación

Login con Google, restringido a una lista de emails. Google dice quién sos, y la
Api verifica que ese quién esté permitido antes de emitir su propio token de
sesión (30 días).

Hace falta un ID de cliente de OAuth de Google Cloud Console y tres valores de
configuración. Los pasos completos están en
**[docs/autenticacion.md](docs/autenticacion.md)**.

Mientras `VITE_GOOGLE_CLIENT_ID` esté vacío en `frontend/.env`, el login ofrece
entrar en modo desarrollo, que no pasa por Google y solo funciona contra una Api
corriendo en `Development`.

## CORS

Los orígenes permitidos se configuran en `appsettings.json` bajo `Cors:OrigenesPermitidos`.
Hay que agregar ahí la URL del frontend antes de conectarlo.

Ojo: el origen también tiene que estar en los **orígenes autorizados de
JavaScript** del cliente de OAuth en Google Cloud Console, o el botón de Google
no funciona aunque CORS esté bien.

## Frontend

React + Vite + TypeScript, en `frontend/`. El diseño visual se genera con Google Stitch
y se pega dentro de los componentes de `src/paginas/`.

```
cd frontend
npm install
npm run dev
```

Queda en `http://localhost:5173`. La URL del backend se configura en `frontend/.env`
(`VITE_API_URL`). Ese origen tiene que estar listado en `Cors:OrigenesPermitidos`
del backend, o el navegador bloquea las llamadas.

Estructura:

```
frontend/src/
├── api/
│   ├── tipos.ts      Espejo TypeScript de los DTOs del backend
│   ├── token.ts      Unico lugar donde se guarda la sesion (localStorage)
│   ├── cliente.ts    Wrapper de fetch: headers, errores y 204 sin cuerpo
│   └── finanzas.ts   Una funcion por endpoint
├── auth/
│   ├── contexto.ts   El hook useSesion() que usan las pantallas
│   ├── sesion.tsx    Proveedor de sesion y RutaProtegida
│   └── google.ts     Carga la libreria de Google Identity Services
├── hooks/
│   ├── usePeticion.ts       Maneja cargando / error / datos en un solo lugar
│   ├── useInstalacion.ts    El boton de instalar la app
│   └── useNotificaciones.ts El recordatorio diario de este navegador
├── componentes/      Piezas compartidas: Logo, Icono, modales, navegacion
│   └── Bienvenida.tsx  Cortina con el video del logo al abrir la app
├── pwa.ts            Registra el service worker
└── paginas/          Una pantalla por archivo
```

Y en `frontend/public/`, lo que hace que sea una app instalable y no una pestaña:
`manifest.webmanifest`, `sw.js` (el service worker, que además recibe los avisos),
los iconos PNG y `favicon.svg`, que es el mismo dibujo que el componente `Logo`.

## Notificaciones

Si el día pasa sin que se cargue ningún movimiento, a la noche llega un aviso al
celular y a la computadora. Va con la Web Push API y sin ninguna librería: los
avisos viajan sin contenido, así que alcanza con firmar la cabecera VAPID.

El horario no lo pone la Api —Cloud Run apaga el contenedor cuando no hay
pedidos— sino un programador de tareas que le pega al endpoint del recordatorio.
Las claves, las variables y la tarea programada están en
**[docs/notificaciones.md](docs/notificaciones.md)**.

## Deploy

Tres servicios: **Supabase** (base), **Google Cloud Run** (la Api, desde el
`Dockerfile` de la raíz) y **Vercel** (el build estático del frontend). El paso a
paso completo, con las variables de entorno de cada uno y los problemas comunes,
está en **[docs/deploy.md](docs/deploy.md)**.

Para probar la imagen de la Api localmente. Ojo que fuera de `Development` la Api
exige las tres claves de autenticación y no arranca sin ellas, a propósito:

```
docker build -t qwak-api .
docker run --rm -p 8080:8080 -e "DATABASE_URL=Host=host.docker.internal;Port=5432;Database=finanzas;Username=finanzas;Password=desarrollo_local" -e "Autenticacion__GoogleClientId=xxx.apps.googleusercontent.com" -e "Autenticacion__EmailsPermitidos__0=tu-mail@gmail.com" -e "Autenticacion__ClaveFirma=una-clave-de-al-menos-32-caracteres" --add-host=host.docker.internal:host-gateway qwak-api
```

Contra `docker compose up -d`, `host.docker.internal` es la forma de que el
contenedor de la Api llegue al de Postgres que corre en la máquina.

## Estado del proyecto

Al 25/08/2026 el backend está completo y verificado de punta a punta contra
PostgreSQL, las ocho pantallas del frontend están integradas y navegables
(Login, Inicio, Movimientos, Nuevo movimiento, Métricas, Cuentas, Categorías
y Ajustes), y la Api está cerrada detrás de login con Google.

### Próximos pasos

Lo que falta está detallado y priorizado en el **[roadmap](docs/roadmap.md)**.
En resumen, lo bloqueante para poder usar la app:

1. **Credenciales de Google** — el código del login ya está; falta crear el ID
   de cliente en Google Cloud Console y cargar la configuración
   ([docs/autenticacion.md](docs/autenticacion.md)).
2. **Deploy** — el `Dockerfile` de la Api y la guía ya están; falta crear las
   cuentas y correrlo ([docs/deploy.md](docs/deploy.md)).
3. **Flujo de carga rápido** — gastos frecuentes en un toque, para que registrar
   algo no dé pereza (fase 2 del roadmap).
