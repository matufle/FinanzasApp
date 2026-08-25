# Prompts para Google Stitch

Pegar el **bloque base** al principio de cada prompt para que las pantallas
salgan consistentes entre si. Los campos que se mencionan son los que la API
ya devuelve, asi el diseño encaja con los datos sin retoques.

## Bloque base (va en todos)

```
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
- Nombre "FinanzasApp" y un subtítulo breve debajo.
- Un único botón de "Continuar con Google" con el logo de Google,
  borde gris y fondo blanco.
- Texto legal muy chico al pie.
```

## Al exportar

Pedir el codigo en HTML + Tailwind (no Figma), que es lo que se pega directo
en los componentes de `frontend/src/paginas/`.
