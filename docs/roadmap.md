# Roadmap de Qwak

Todo lo que falta hacer, ordenado. La regla es la misma de siempre: primero lo
que hace falta para **usar la app todos los días** (deadline: septiembre 2026),
después lo que la hace mejor.

Estado al 25/08/2026: backend .NET 10 completo y probado, frontend con las siete
pantallas integradas y navegables. Lo que sigue es lo que falta.

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

### 1.3 OAuth 2 con Google
JWT Bearer en la Api, `.RequireAuthorization()` sobre los grupos de endpoints,
restringido a un solo email (el tuyo). Domain / Application / Infrastructure no
se tocan: es todo capa Api + la pantalla de Login.

El frontend ya está preparado: hay que reemplazar el `entrarConGoogle()`
placeholder de `src/paginas/Login.tsx` por el flujo real y llamar a
`iniciarSesion(tokenReal, usuario)`. El contexto de sesión ya tiene el campo
`usuario` (nombre / email / foto) esperando que OAuth se lo pase, y el cliente
HTTP ya manda el token como `Bearer` en cada pedido.

### 1.4 Deploy
- **Backend**: contenedor con la Api. `DATABASE_URL` apuntando a Supabase.
- **Frontend**: build estático de Vite. `VITE_API_URL` apuntando a la Api.
- **CORS**: agregar el dominio del frontend a `Cors:OrigenesPermitidos`.
- Aplicar las migraciones contra la base de producción.

### 1.5 Tests
`FinanzasApp.Application.Tests` sigue con el `UnitTest1` de plantilla. Lo más
valioso, por orden: `ServicioMovimiento` (la validación de que el tipo del
movimiento coincida con el de la categoría), `ServicioMetricas` (los cálculos
de tasa de ahorro y proyección, que son fáciles de romper sin darse cuenta) y
`ServicioCuenta` (el saldo calculado).

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

## Fase 3 — Métricas

La Api de métricas ya está hecha (25/08/2026): `GET /api/reportes/metricas`
devuelve todo esto en una sola respuesta. Falta la pantalla.

- **Tasa de ahorro del mes** — qué porcentaje de lo que entró no se gastó. ✅ Api
- **Comparativa mes a mes** — cuánto más o menos se gastó y se ganó contra el
  mes anterior, en plata y en porcentaje. ✅ Api
- **Proyección a fin de mes** — al ritmo de gasto actual, cómo termina el mes;
  y cuánto queda disponible por día para no pasarse. ✅ Api
- **Flujo de caja** — gráfico de barras con ingresos vs egresos de los últimos
  6 meses. ✅ Api
- **Top categorías de egreso** del mes. ✅ Api
- Pendiente: **pantalla de Métricas** (el prompt para Stitch está en
  [prompts-stitch.md](prompts-stitch.md), sección 8).

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
