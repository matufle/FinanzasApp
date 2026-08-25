// Logo de la app dibujado como SVG en vez de una imagen.
// El diseño de Stitch venia con un <img> apuntando a un archivo temporal de
// Google que deja de existir a los pocos dias; asi el logo viaja con el codigo,
// escala sin pixelarse y no depende de internet.
export function Logo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FinanzasApp"
    >
      <rect width="96" height="96" rx="28" className="fill-primary" />
      <rect x="24" y="54" width="12" height="22" rx="6" fill="#ffffff" fillOpacity="0.45" />
      <rect x="42" y="42" width="12" height="34" rx="6" fill="#ffffff" fillOpacity="0.7" />
      <rect x="60" y="26" width="12" height="50" rx="6" className="fill-secondary-fixed-dim" />
    </svg>
  );
}
