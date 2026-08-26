// Isotipo de Qwak.
//
// Los trazos salen tal cual del SVG original del logo; no estan escritos a mano
// ni retocados. Son cuatro figuras macizas, y el ojo es un agujero del mismo
// trazo de la cabeza, no un circulo pintado encima: por eso deja ver el fondo
// que haya atras, sea el que sea.
//
// Va como SVG y no como imagen para que escale sin pixelarse (aparece a 96px en
// el login y a 32px en las barras superiores) y para que tome el color del tema
// en vez de traerlo quemado. El mismo dibujo, con los colores puestos a mano,
// esta en public/favicon.svg, que lo lee el navegador para la pestaña y para el
// icono de la app instalada.

// El dibujo ocupa 458 x 449 de un lienzo de 1024, arrancando en (291, 291). La
// vista lo encuadra en un cuadrado centrado sobre esa caja, con un margen
// minimo para que el antialias no le coma los bordes.
const VISTA = "286 281.5 468 468";

// El original viene dado vuelta en el eje Y, como sale de vectorizar: la
// transformacion lo endereza. Se deja asi en lugar de recalcular cada numero.
const ENDEREZAR = "translate(0,1024) scale(0.1,-0.1)";

export function Logo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={VISTA}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Qwak"
    >
      <g transform={ENDEREZAR} className="fill-primary-container">
        {/* Anillo de la Q, abierto arriba a la derecha */}
        <path
          d="M4921 7319 c-572 -51 -1127 -345 -1505 -799 -248 -296 -417 -669
            -481 -1060 -22 -139 -30 -412 -16 -555 53 -512 261 -960 615 -1323 339 -349
            775 -570 1276 -649 155 -24 460 -24 619 1 197 30 541 129 541 155 0 5 -26 37
            -58 72 -57 64 -314 355 -362 411 l-25 29 -100 -22 c-134 -29 -433 -33 -572 -6
            -568 107 -1036 521 -1217 1078 -54 167 -69 270 -70 469 0 145 4 194 23 285 34
            161 65 254 136 400 191 395 539 688 965 815 93 27 258 57 349 62 l43 3 24 95
            c51 205 202 425 344 500 23 12 23 13 4 20 -32 12 -254 30 -351 29 -48 -1 -130
            -6 -182 -10z"
        />
        {/* Cabeza, pico y cuello. El ojo es un agujero del mismo trazo */}
        <path
          d="M5775 7274 c-149 -32 -247 -85 -355 -193 -98 -99 -157 -202 -190
            -335 -19 -76 -20 -114 -20 -850 0 -626 -3 -789 -15 -866 -32 -210 -94 -347
            -218 -486 l-46 -50 87 19 c127 29 381 29 507 0 104 -24 255 -81 335 -126 85
            -47 232 -151 294 -208 31 -28 59 -49 63 -46 3 4 17 44 31 89 31 103 42 330 22
            442 -21 119 -84 281 -193 502 -107 218 -133 293 -143 417 -15 183 78 360 251
            477 l72 48 444 4 c492 5 497 6 636 73 90 44 153 111 153 162 0 71 -35 96 -145
            108 -235 23 -505 131 -685 274 -132 104 -169 143 -210 218 -85 154 -250 280
            -417 317 -65 15 -208 20 -258 10z m315 -439 c66 -34 92 -104 65 -173 -31 -77
            -106 -108 -178 -73 -52 25 -77 65 -77 121 0 102 103 170 190 125z"
        />
        {/* Pecho: el arco que continua la circunferencia del otro lado de la abertura */}
        <path
          d="M6732 5983 l-312 -3 24 -38 c68 -108 137 -265 174 -397 63 -220 76
            -500 34 -711 -51 -257 -178 -529 -334 -717 l-40 -48 33 -37 c104 -118 393
            -421 407 -427 19 -7 38 13 146 150 242 305 400 690 452 1097 40 319 -8 738
            -118 1025 -16 43 -32 86 -35 96 -4 14 -15 17 -62 15 -31 -2 -197 -4 -369 -5z"
        />
        {/* Ola */}
        <path
          d="M5110 4403 c-74 -13 -217 -56 -281 -86 -41 -19 -110 -61 -154 -94
            -82 -62 -173 -149 -164 -157 3 -3 34 4 69 16 47 15 100 22 190 25 110 4 137 1
            225 -21 193 -50 382 -165 559 -341 56 -55 192 -203 303 -330 110 -126 236
            -264 280 -306 187 -184 381 -269 608 -269 200 0 360 60 511 191 45 39 134 137
            134 148 0 3 -46 6 -103 7 -107 0 -168 14 -282 61 -176 73 -355 231 -790 696
            -246 263 -481 403 -760 453 -73 13 -285 17 -345 7z"
        />
      </g>
    </svg>
  );
}
