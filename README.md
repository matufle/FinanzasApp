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

| Método | Ruta | Qué hace |
|---|---|---|
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

## CORS

Los orígenes permitidos se configuran en `appsettings.json` bajo `Cors:OrigenesPermitidos`.
Hay que agregar ahí la URL del frontend antes de conectarlo.

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
│   ├── cliente.ts    Wrapper de fetch: headers, errores y 204 sin cuerpo
│   └── finanzas.ts   Una funcion por endpoint
├── hooks/
│   └── usePeticion.ts  Maneja cargando / error / datos en un solo lugar
└── paginas/          Una pantalla por archivo
```

## Estado del proyecto

Al 25/08/2026 el backend está completo y verificado de punta a punta contra
PostgreSQL, y las ocho pantallas del frontend están integradas y navegables:
Login, Inicio, Movimientos, Nuevo movimiento, Métricas, Cuentas, Categorías
y Ajustes.

### Próximos pasos

Lo que falta está detallado y priorizado en el **[roadmap](docs/roadmap.md)**.
En resumen, lo bloqueante para poder usar la app:

1. **OAuth 2 con Google** — JWT Bearer en la Api, restringido al email propio.
   Solo toca la capa Api y la pantalla de Login.
2. **Deploy** — base en Supabase vía `DATABASE_URL`, y el dominio del frontend
   agregado a `Cors:OrigenesPermitidos`.
3. **Flujo de carga rápido** — gastos frecuentes en un toque, para que registrar
   algo no dé pereza (fase 2 del roadmap).
