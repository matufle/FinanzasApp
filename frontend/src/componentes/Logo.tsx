// Isotipo de Qwak: una Q formada por el anillo, con la cabeza del pato
// asomando arriba a la derecha y la ola cruzando abajo como cola de la letra.
//
// Esta dibujado como SVG y no como imagen para que escale sin pixelarse
// (aparece a 96px en el login y a 32px en las barras superiores) y para que
// no dependa de un archivo externo.
export function Logo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Qwak"
    >
      <g className="stroke-primary-container" strokeLinecap="round" fill="none">
        {/* Anillo de la Q, abierto a la derecha para dejar entrar al pato */}
        <path d="M 57.5 24.6 A 27 27 0 1 0 59.5 70.1" strokeWidth="11" />

        {/* Cuello */}
        <path d="M 58 39 C 58 50, 55 57, 53 64" strokeWidth="11" />

        {/* Ola: cruza el anillo y sale hacia abajo a la derecha */}
        <path d="M 36 70 C 44 62, 52 78, 62 70 C 68 65, 72 68, 76 74" strokeWidth="9" />
      </g>

      <g className="fill-primary-container">
        {/* Cabeza y pico */}
        <circle cx="60" cy="30" r="10" />
        <path d="M 68 26 L 78 32 L 68 36 Z" />
      </g>

      <circle cx="62.5" cy="27" r="2.2" className="fill-surface-container-lowest" />
    </svg>
  );
}
