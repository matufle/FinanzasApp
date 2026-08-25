# Roadmap de Qwak

Todo lo que falta hacer, ordenado. La regla es la misma de siempre: primero lo
que hace falta para **usar la app todos los días** (deadline: septiembre 2026),
después lo que la hace mejor.

Estado al 25/08/2026: backend .NET 10 completo y probado, frontend con las ocho
pantallas integradas y navegables, y la Api cerrada detrás de login con Google.
Lo que sigue es lo que falta.

---

## Fase 1 — Que la app sea usable de verdad (bloqueante)

Sin esto no se puede empezar a registrar plata en serio.

### 1.1 Datos semilla ✅ (25/08/2026)
Precargar categorías típicas (Sueldo, Supermercado, Alquiler, Transporte,
Salidas, etc.) con su ícono, para que la app no arranque vacía. Se siembra sola
al levantar la Api si la tabla de categorías está vacía.

### 1.2 Base de datos gestionada — **decisión: Supabase**
Neon quedó descartado para este proyecto: el free tier tiene un tope de
compute-hours mensuales y ya está consumido. Supabase, en cambio, no cobra por
hora de cómputo en el plan gratis; el límite es de tamaño (500 MB) y de pausa
por inactividad (7 días sin ninguna conexión). Para una app que se usa a diario
y guarda filas de texto y números, ninguno de los dos límites se toca nunca.

No hay que tocar código: `CadenaConexion.Resolver` ya traduce la URL
`postgresql://...` que da Supabase al formato que espera Npgsql. Solo hay que
poner la URL en la variable de entorno `DATABASE_URL`.

**Ojo con Supabase:** conviene usar el *connection pooler* (puerto 6543,
Transaction mode) y no la conexión directa (5432), porque el pooler es el que
aguanta que la Api abra y cierre conexiones todo el tiempo.

### 1.3 OAuth 2 con Google — código listo (25/08/2026), falta configurarlo
Implementado de punta a punta. Los cuatro grupos de endpoints
(`/api/cuentas`, `/api/categorias`, `/api/movimientos`, `/api/reportes`) van con
`.RequireAuthorization()` y devuelven 401 sin sesión. Domain, Application e
Infrastructure no se tocaron: es todo capa Api más la pantalla de Login.

El flujo: Google devuelve un ID token, `POST /api/auth/google` lo valida contra
las claves públicas de Google, chequea que el email esté en `EmailsPermitidos` y
emite un token propio de 30 días. Se emite uno propio porque el de Google dura
una hora y desde el celular eso es volver a loguearse todo el tiempo.

**Lo único que falta es crear las credenciales en Google Cloud Console y
cargarlas.** Los pasos exactos, las tres claves de la Api y los problemas
comunes están en [`docs/autenticacion.md`](autenticacion.md).

Mientras tanto hay un modo desarrollo: si `VITE_GOOGLE_CLIENT_ID` está vacío, el
login ofrece entrar sin Google contra `POST /api/auth/desarrollo`, endpoint que
solo se mapea cuando la Api corre en `Development`.

Pendiente chico: no hay tests de integración sobre los endpoints protegidos
(hoy la verificación de que un 401 llega cuando corresponde se hizo a mano).

### 1.4 Deploy — repo listo (25/08/2026), falta correrlo

**Decisión: Supabase (base) + Google Cloud Run (Api) + Vercel (frontend).**

Cloud Run sobre Render porque el plan gratis de Render deja de serlo a los tres
meses; sobre Fly porque Cloud Run es la misma cuenta de Google donde ya están
las credenciales de OAuth, escala a cero (sin pedidos no factura) y lo que se
sube es un contenedor común, así que mudarlo después es correr un `deploy` en
otro lado.

Lo que ya está en el repo:
- `Dockerfile` multi-etapa en la raíz (SDK para compilar, runtime para correr;
  imagen final de ~370 MB) más `.dockerignore`. Probado localmente: levanta en
  `Production`, aplica las migraciones y contesta 401 sin sesión.
- `Program.cs` lee la variable `PORT`, que es como Cloud Run le dice al
  contenedor dónde escuchar.
- `frontend/vercel.json` con el rewrite a `index.html`, sin el cual entrar
  directo a `/movimientos` o apretar F5 da 404.
- La guía completa, paso por paso: [`docs/deploy.md`](deploy.md).

Lo que falta es todo cuenta y consola, no código: crear el proyecto de Supabase,
habilitar facturación en Google Cloud, correr el `gcloud run deploy`, importar
el frontend en Vercel y, al final, atar los dos cabos que necesitan el dominio
de Vercel: `Cors__OrigenesPermitidos__0` en la Api y los orígenes autorizados de
JavaScript en Google Cloud Console.

### 1.5 Tests — parcial (25/08/2026)
30 tests sobre `ServicioMovimiento` (la validación de que el tipo del movimiento
coincida con el de la categoría) y `ServicioMetricas` (los cálculos de tasa de
ahorro y proyección), con repositorios en memoria en `Dobles/`.

Falta `ServicioCuenta` (el saldo calculado) y tests de integración sobre los
endpoints, que ahora además tendrían que cubrir la autenticación: que un pedido
sin token dé 401 y que uno con token válido pase.

---

## Fase 2 — Que registrar un gasto no dé pereza

Este es el punto que hace que las apps de finanzas se abandonen: cargar un
movimiento son demasiados toques. Todo lo de acá apunta a bajar eso a uno o dos.

### 2.1 Gastos frecuentes / carga en un toque
Botones de acceso rápido con los gastos que se repiten ("Café $2.500",
"Subte $1.200"). Un toque y queda cargado, sin abrir el formulario.

Dos formas de armarlos, no excluyentes:
- **Automáticos**: la Api detecta las combinaciones de categoría + monto +
  descripción más repetidas de los últimos 60 días y devuelve las 6 mejores.
- **Fijados a mano**: el usuario marca un movimiento como "frecuente" y queda
  siempre arriba.

Lo mínimo que hace falta: endpoint `GET /api/movimientos/frecuentes` y una fila
de chips arriba del formulario de Nuevo movimiento (y, mejor todavía, en Inicio).

### 2.2 Repetir un movimiento
En la lista de movimientos, además del swipe para anular, un swipe (o un menú)
para "repetir hoy". Es la forma más barata de cargar algo que ya cargaste antes.

### 2.3 Valores por defecto inteligentes
Que el formulario venga pre-llenado: última cuenta usada, fecha de hoy, tipo
Egreso (que es el 90% de los casos). Hoy ya arranca en Egreso; falta recordar
la cuenta.

### 2.4 Editar un movimiento
Hoy solo se puede anular y volver a cargar. Falta `PUT /api/movimientos/{id}`.

---

## Fase 3 — Métricas ✅ (25/08/2026)

Hecha de punta a punta: `GET /api/reportes/metricas` devuelve todo en una sola
respuesta y la pantalla `/metricas` la consume.

- **Tasa de ahorro del mes** — qué porcentaje de lo que entró no se gastó. ✅ Api
- **Comparativa mes a mes** — cuánto más o menos se gastó y se ganó contra el
  mes anterior, en plata y en porcentaje. ✅ Api
- **Proyección a fin de mes** — al ritmo de gasto actual, cómo termina el mes;
  y cuánto queda disponible por día para no pasarse. ✅ Api
- **Flujo de caja** — gráfico de barras con ingresos vs egresos de los últimos
  6 meses. ✅ Api
- **Top categorías de egreso** del mes. ✅ Api
- **Pantalla de Métricas** en `/metricas`. ✅ (25/08/2026)

La pantalla quedó integrada con las dos maquetas de Stitch (llena y vacía).
Con ella la barra de navegación pasó a tener 5 ítems. Pendientes chicos: falta
el filtro por cuenta (la Api ya acepta `cuentaId`) y elegir cuántos meses
muestra el flujo de caja (hoy son 6 fijos).

---

## Fase 4 — Funcionalidades nuevas

Ordenadas por relación valor / esfuerzo, no por preferencia.

### 4.1 Buscador avanzado
Buscar "hamburguesa" y ver todos los gastos que digan eso, con el total gastado.
Filtros combinables: texto, rango de fechas, categoría, cuenta, rango de montos.
Es barato de hacer (un `WHERE ILIKE` más filtros) y se usa muchísimo.

### 4.2 Presupuesto por categoría
Fijar un tope mensual por categoría ("Salidas: $150.000") y ver una barra de
progreso de cuánto va consumido. Entidad nueva `Presupuesto` (categoría, monto,
mes). Se cruza naturalmente con las alertas de la fase 5.

### 4.3 Movimientos recurrentes
Suscripciones y gastos fijos: Netflix el día 12, alquiler el día 1. Se configura
una vez y la app los carga sola (o pregunta antes de cargarlos), y avisa unos
días antes. Entidad `MovimientoRecurrente` (plantilla del movimiento + día del
mes + frecuencia + si autocarga o solo avisa) más un proceso que corre una vez
por día.

Es la funcionalidad que más se apoya en las notificaciones (fase 5): sin aviso
previo pierde la mitad de la gracia.

### 4.4 Metas de ahorro
Estilo Mercado Pago: "Viaje — $2.000.000 para diciembre", con progreso y cuánto
falta por mes. Entidad `Meta` (nombre, monto objetivo, fecha objetivo, cuenta
asociada opcional) y movimientos que aportan a la meta.

### 4.5 Gestor de deudas
"Me deben / yo debo": anotar que alguien te debe plata o que vos debés, con
quién, cuánto y desde cuándo, y marcarlo como saldado. Entidad `Deuda`
(persona, monto, dirección, fecha, estado). Ojo con una decisión de diseño:
una deuda **no** es un movimiento (no cambia el saldo de una cuenta hasta que
se paga), así que va en su propia tabla y genera un movimiento recién al saldarse.

### 4.6 Exportar datos
Bajar los movimientos de un rango a CSV o Excel. Lo barato es CSV
(`GET /api/movimientos/exportar?desde&hasta` devolviendo `text/csv`); Excel real
necesita una librería como ClosedXML. La fila "Exportar movimientos" ya está
prevista en el prompt de Ajustes como extra opcional.

### 4.7 Soporte multimoneda
El más caro de todos, y hay que pensarlo bien antes de tocar nada.

Cargar en pesos, dólares o cripto. La decisión importante: cada `Movimiento`
guarda su moneda original **y** el monto convertido a la moneda base al momento
de cargarse (la cotización de hoy no sirve para valuar un gasto de hace tres
meses). Eso implica:
- `Moneda` como entidad o enum, y una moneda base configurable.
- `Movimiento` gana `Moneda` + `Cotizacion` + `MontoEnMonedaBase`.
- `Cuenta` gana una moneda propia (una caja de ahorro en dólares no mezcla).
- Una fuente de cotizaciones (para ARS/USD, algo tipo dolarapi.com; para cripto,
  otra) y un caché diario.
- Todos los reportes y el patrimonio pasan a sumar en la moneda base.

**Sugerencia:** dejarlo para después de la fase 5. Toca las cuatro capas y todos
los cálculos existentes; conviene que el resto esté estable y probado antes.

---

## Fase 5 — Notificaciones

Que la app avise en el celular y en la computadora (Windows), sin depender de
tenerla abierta.

**Cómo:** convertir el frontend en una PWA (service worker + manifest) y usar la
Web Push API. Con eso, una sola implementación cubre Chrome en Windows (los
avisos aparecen en el centro de notificaciones de Windows), Android, y iOS
≥ 16.4 si la app se agrega a la pantalla de inicio. No hace falta app nativa ni
Firebase: alcanza con claves VAPID y una librería de push del lado .NET.

**Qué hace falta del lado servidor:**
- Entidad `SuscripcionPush` (endpoint del navegador + claves), un endpoint para
  registrarla y otro para darla de baja.
- Un proceso programado (`BackgroundService` con un tick diario) que evalúe qué
  avisos corresponden y los mande.
- Entidad `Recordatorio` para los avisos que el usuario carga a mano.

**Qué avisar:**
- Un recurrente que se cobra en X días (fase 4.3).
- Un presupuesto de categoría al 80% y al 100% (fase 4.2).
- Recordatorios propios ("acordate de anotar el almuerzo").
- Resumen semanal o de fin de mes: cuánto gastaste, cómo venís contra el mes
  anterior.
- Recordatorio de carga si pasaron varios días sin registrar nada.

Todo configurable desde Ajustes: qué avisos sí y cuáles no, y a qué hora.

---

## Fase 6 — Multiusuario

**Va última a propósito, y es el cierre del proyecto.** Hasta acá Qwak es de una
sola persona, y no es solo el login: el modelo de datos entero asume un dueño
único. `Cuenta`, `Categoria` y `Movimiento` no tienen `UsuarioId`, y no existe
tabla de usuarios. `EmailsPermitidos` no es una lista de usuarios: es la lista de
quiénes pueden entrar a *esta* instalación.

Es decir que hoy, si entrara otra persona, vería y editaría los mismos datos.

El motivo para hacerlo algún día es concreto: la app va a ir al portfolio, y una
app de finanzas que cualquiera puede probar con su cuenta se demuestra sola,
mientras que una que solo corre con los datos del autor hay que explicarla.

### 6.1 Multiusuario propiamente dicho
Lo caro, y lo que hay que hacer primero:

- Entidad `Usuario` (email como identidad canónica, nombre, foto, fecha de alta).
- `UsuarioId` en `Cuenta`, `Categoria` y `Movimiento`.
- Filtrado por usuario en **todos** los repositorios. Es el punto donde se cuelan
  las fugas de datos: alcanza con una consulta sin filtrar para que alguien vea
  los movimientos de otro.
- Migración de los datos existentes, asignándolos al usuario original.
- Revisar saldos, reportes y métricas, que hoy suman sobre toda la tabla.
- Los datos semilla pasan a sembrarse **por usuario nuevo**, no una vez por base.
- Tests de que un usuario no puede leer ni tocar nada de otro. No son opcionales:
  es la clase de bug que no se nota hasta que es un problema serio.

Ojo: esto es independiente de cómo se loguee la gente. Se puede hacer entero
manteniendo solo el login con Google, y conviene hacerlo así.

### 6.2 Login propio con email y contraseña
Solo si hace falta, y **después** de 6.1. Sirve para quien no tiene o no quiere
usar cuenta de Google.

- Hash con Argon2id o BCrypt. Nunca el hash a mano, nunca SHA de la contraseña.
- Verificación de email, "olvidé mi contraseña" con tokens de un solo uso y
  vencimiento corto, y rate limiting contra fuerza bruta.
- Un servicio de correo (Resend, Postmark o similar) para mandar todo eso.

La parte que se subestima no es guardar el hash: es el ciclo de vida completo.

### 6.3 Vincular cuentas (*account linking*)
El problema real: alguien se registró con Google y después intenta entrar con
email y contraseña usando el mismo mail. Sin resolverlo quedan dos cuentas
distintas con los mismos datos partidos al medio.

La solución estándar es que **la identidad canónica sea el email, no el
proveedor**: una fila en `Usuario` por email, y una tabla `IdentidadExterna`
(proveedor + id externo + fecha) con una fila por cada forma de entrar. Si el
email ya existe, se pide confirmar por el proveedor original y se vinculan.

**La trampa:** solo se puede vincular por email si el proveedor lo dio como
verificado. Por eso `ServicioSesion` ya chequea `EmailVerified` antes de aceptar
el token de Google — sin eso, alguien podría registrar tu email en un proveedor
que no verifica nada y quedarse con tu cuenta.

---

## Pendientes menores

- Vite a veces sirve una versión vieja de un archivo editado dos veces en el
  mismo segundo (su caché de transformación va por mtime). Síntoma típico:
  "No routes matched" para una ruta que sí está en `App.tsx`. Se arregla
  volviendo a tocar el archivo un segundo después.
- La carpeta `tests/` en la raíz está vacía; el proyecto de tests vive en `src/`.
- `EntidadBase.Cs` tiene la extensión con C mayúscula.
- `Cuenta` no tiene campo de ícono: hoy se adivina por el nombre en
  `iconoDeCuenta`. Si molesta, se agrega igual que se hizo con `Categoria.Icono`.
- `MovimientoDto` no trae el ícono de la categoría, así que la lista de
  movimientos tiene que cruzar contra el listado de categorías para pintarlo.
  Agregarlo al DTO ahorraría un pedido.
- Modo oscuro: los tokens de Material 3 ya están en `index.css`, falta la
  variante y el interruptor en Ajustes.
