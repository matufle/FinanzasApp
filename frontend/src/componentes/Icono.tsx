// Los iconos son texto: el <span> lleva el nombre del icono de Material Symbols
// ("restaurant", "home") y la fuente lo convierte en dibujo. Por eso no hay que
// instalar ninguna libreria de iconos.
export function Icono({
  nombre,
  relleno = false,
  className = "",
}: {
  nombre: string;
  relleno?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={relleno ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {nombre}
    </span>
  );
}
