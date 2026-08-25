# Prompts para Google Stitch

Pegar el **bloque base** al principio de cada prompt para que las pantallas
salgan consistentes entre si. Los campos que se mencionan son los que la API
ya devuelve, asi el diseño encaja con los datos sin retoques.

## Bloque base (va en todos)

```
La app se llama "Qwak" y su logo es un pato azul marino dentro de una Q.
App de finanzas personales en español, diseño mobile-first (390x844).
Estilo minimalista y limpio, mucho espacio en blanco, esquinas redondeadas,
tipografía sans-serif legible. Verde para ingresos, rojo para egresos,
gris oscuro para texto principal. Barra de navegación inferior fija con 4
íconos: Inicio, Movimientos, Cuentas, Ajustes. Montos en pesos argentinos
con separador de miles.
```

## 1. Inicio

Endpoints que la alimentan: `GET /api/reportes/resumen`, `GET /api/cuentas`,
`GET /api/movimientos`

```
Pantalla de inicio de una app de finanzas. De arriba a abajo:
- Encabezado con el mes actual y flechas para ir al mes anterior y siguiente.
- Tarjeta grande destacada con el "Balance del mes", en grande y centrado,
  con color verde si es positivo y rojo si es negativo.
- Debajo, dos tarjetas lado a lado: "Ingresos" y "Egresos", cada una con
  su monto total y un ícono de flecha hacia arriba o hacia abajo.
- Sección "Mis cuentas": lista horizontal deslizable de tarjetas, cada una
  con el nombre de la cuenta y su saldo actual.
- Sección "Últimos movimientos": lista de 5 filas, cada fila con el ícono
  de la categoría a la izquierda, la descripción y el nombre de la categoría
  en el medio, y el monto a la derecha en verde o rojo según el tipo.
- Botón flotante circular con un "+" en la esquina inferior derecha.
```

## 2. Movimientos

Endpoints: `GET /api/movimientos`, `DELETE /api/movimientos/{id}`

```
Pantalla de listado de movimientos de una app de finanzas.
- Barra superior con título "Movimientos" y un ícono de filtro.
- Fila de chips de filtro deslizables: "Todos", "Ingresos", "Egresos",
  y un selector de cuenta.
- Selector de rango de fechas compacto debajo de los chips.
- Lista de movimientos agrupados por día, con un encabezado de fecha
  separando cada grupo. Cada fila muestra: ícono de categoría, descripción,
  nombre de la categoría y nombre de la cuenta en texto chico, y el monto
  a la derecha en verde o rojo.
- Al deslizar una fila hacia la izquierda se revela un botón rojo de eliminar.
- Estado vacío ilustrado con el texto "No hay movimientos en este período".
```

## 3. Nuevo movimiento

Endpoints: `POST /api/movimientos`, `GET /api/categorias`, `GET /api/cuentas`

```
Pantalla de formulario para registrar un movimiento de dinero.
- Barra superior con una X para cancelar a la izquierda y "Guardar" a la derecha.
- Selector segmentado grande arriba con dos opciones: "Ingreso" y "Egreso".
  La opción activa se resalta en verde o rojo según corresponda.
- Campo de monto muy grande y centrado, estilo calculadora, con el símbolo $
  antepuesto.
- Campo "Descripción" con texto de ayuda "¿En qué gastaste?".
- Selector de "Categoría" que muestra las categorías como una grilla de
  chips con ícono, seleccionable.
- Selector de "Cuenta" como lista desplegable.
- Selector de "Fecha" con un calendario, por defecto en el día de hoy.
- Botón principal ancho abajo que dice "Guardar movimiento".
```

## 4. Cuentas

Endpoints: `GET /api/cuentas`, `POST /api/cuentas`, `DELETE /api/cuentas/{id}`

```
Pantalla de administración de cuentas de una app de finanzas.
- Barra superior con título "Mis cuentas".
- Tarjeta destacada arriba con el "Patrimonio total", sumando todas las cuentas.
- Lista vertical de tarjetas de cuenta. Cada tarjeta muestra el nombre de la
  cuenta, el saldo actual en grande, y el saldo inicial en texto chico y gris.
- Cada tarjeta tiene un menú de tres puntos en la esquina.
- Botón "Agregar cuenta" al final de la lista, con estilo de borde punteado.
- Incluir también el modal de "Nueva cuenta" con dos campos: "Nombre" y
  "Saldo inicial", y botones "Cancelar" y "Crear".
```

## 5. Categorías

Endpoints: `GET /api/categorias`, `POST /api/categorias`, `DELETE /api/categorias/{id}`

```
Pantalla de administración de categorías de una app de finanzas.
- Barra superior con título "Categorías".
- Dos pestañas: "Egresos" e "Ingresos".
- Grilla de dos columnas con las categorías. Cada celda tiene un ícono
  circular de color, el nombre de la categoría debajo, y la cantidad de
  movimientos en texto chico.
- Celda final de la grilla con un "+" para agregar una categoría nueva.
- Incluir el modal de "Nueva categoría" con un campo de nombre, un selector
  de tipo (Ingreso o Egreso) y una paleta de íconos para elegir.
```

## 6. Login

Todavia sin endpoint: se implementa junto con OAuth 2 de Google.

```
Pantalla de inicio de sesión de una app de finanzas personales.
- Diseño centrado y muy simple, con mucho espacio en blanco.
- Logo o ícono de la app en la parte superior.
- Nombre "Qwak" y un subtítulo breve debajo.
- Un único botón de "Continuar con Google" con el logo de Google,
  borde gris y fondo blanco.
- Texto legal muy chico al pie.
```

## Al exportar

Pedir el codigo en HTML + Tailwind (no Figma), que es lo que se pega directo
en los componentes de `frontend/src/paginas/`.

## 7. Ajustes

Endpoints: ninguno propio. Es una pantalla de navegacion hacia Cuentas y
Categorias, mas el cierre de sesion (que vive en el frontend).

```
Pantalla de ajustes de una app de finanzas personales.
- Barra superior con el título "Ajustes".
- Arriba de todo, una tarjeta de perfil: foto redonda del usuario a la
  izquierda, y a la derecha el nombre y el email en texto más chico y gris.
- Debajo, grupos de opciones separados por un título de sección en
  mayúsculas chicas y gris.
- Grupo "MI DINERO" con dos filas: "Cuentas" con ícono de billetera, y
  "Categorías" con ícono de etiquetas. Cada fila tiene el ícono a la
  izquierda, el texto en el medio y una flecha ">" gris a la derecha.
- Grupo "LA APP" con una fila "Acerca de" con ícono de información.
- Al final, separado del resto, un botón de "Cerrar sesión" en rojo, con
  ícono de salida, sin flecha.
- Debajo del botón, centrado y muy chico en gris, el texto "Versión 1.0.0".
- Las filas van agrupadas en tarjetas blancas redondeadas, con una línea
  separadora fina entre filas del mismo grupo.
```

### Extras opcionales

Estas dos filas quedan lindas en el diseño pero **todavia no existen**:
exportar necesita un endpoint nuevo en la Api, y el tema oscuro necesita que
se implemente el modo oscuro en el frontend. Pedirlas solo cuando se vayan a
construir, para no dejar botones que no hacen nada.

```
- Grupo "DATOS" con una fila "Exportar movimientos" con ícono de descarga.
- Grupo "PREFERENCIAS" con una fila "Tema oscuro" que en vez de flecha
  tiene un interruptor de encendido/apagado a la derecha.
```

## 8. Métricas

Endpoint: `GET /api/reportes/metricas?anio&mes&cuentaId&meses`

Devuelve todo en una sola respuesta: `actual` y `anterior` (ingresos, egresos,
balance del mes), `comparativa` (diferencias y variaciones porcentuales),
`tasaDeAhorro` (0 a 1, o null si no hubo ingresos), `proyeccion`
(promedio diario de egresos, egresos y balance proyectados a fin de mes,
disponible por dia), `flujoDeCaja` (un item por mes, del mas viejo al mas
nuevo) y `topEgresos` (categorias del mes, de mayor a menor).

Ojo con dos casos que el diseño tiene que contemplar: `tasaDeAhorro` y las
variaciones pueden venir en null (mes sin ingresos, o mes anterior en cero),
y ahi hay que mostrar un guion o la diferencia en plata en vez de un
porcentaje. Pedirle a Stitch el estado vacio junto con la pantalla.

```
Pantalla de métricas de una app de finanzas personales.
- Barra superior con el título "Métricas" y, debajo, un navegador de mes con
  flechas a los costados y "Agosto 2026" en el medio.
- Primero, una tarjeta grande de "Tasa de ahorro" con un porcentaje bien
  grande en el centro (por ejemplo "55%"), un anillo de progreso circular
  alrededor, y debajo en texto chico "ahorraste $55.000 de $100.000".
- Debajo, dos tarjetas lado a lado comparando con el mes anterior: una de
  "Ingresos" y otra de "Gastos". Cada una muestra el monto del mes, y abajo
  una flecha hacia arriba o hacia abajo con el porcentaje de variación en
  verde o rojo y el texto "vs mes anterior".
- Después, una tarjeta de "Proyección a fin de mes": el monto proyectado de
  gastos en grande, una línea de texto que diga "si seguís a este ritmo", y
  destacado abajo "te quedan $3.437 por día".
- Después, una tarjeta de "Flujo de caja" con un gráfico de barras de los
  últimos 6 meses. Cada mes tiene dos barras pegadas: una verde de ingresos
  y una roja de egresos. Etiquetas de mes abreviadas abajo ("mar", "abr",
  "may"...) y una leyenda chica arriba a la derecha.
- Al final, una lista de "En qué se te fue" con las categorías de gasto del
  mes ordenadas de mayor a menor: ícono circular, nombre, monto a la derecha
  y una barra de progreso fina debajo que muestre qué porcentaje del gasto
  total representa.
- Incluir también la versión vacía de la pantalla, para cuando el mes todavía
  no tiene movimientos: una ilustración simple y el texto "Todavía no hay
  datos de este mes".
```

Cuando esta pantalla se integre hay que agregarla a la barra de navegación
(`frontend/src/componentes/navegacion.tsx`), que pasa a tener 5 ítems.
