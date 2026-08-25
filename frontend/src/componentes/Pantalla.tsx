import type { ReactNode } from "react";
import { NavegacionInferior, NavegacionLateral } from "./navegacion";
import type { Seccion } from "./navegacion";

interface Props {
  activo: Seccion;
  encabezado: ReactNode;
  children: ReactNode;
}

// Marco comun de todas las pantallas de la app: barra inferior en celular,
// menu lateral en escritorio y el contenido centrado. Cada pantalla pone
// adentro solo lo suyo y no vuelve a resolver la navegacion.
export function Pantalla({ activo, encabezado, children }: Props) {
  return (
    <div className="relative min-h-[100dvh] bg-background pb-[80px] text-on-background antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed md:pb-0 md:pl-64">
      {encabezado}
      <main className="mx-auto w-full max-w-[800px]">{children}</main>
      <NavegacionInferior activo={activo} />
      <NavegacionLateral activo={activo} />
    </div>
  );
}

// Barra superior pegajosa. Los tres huecos (izquierda / centro / derecha)
// mantienen el titulo centrado aunque alguno de los costados este vacio.
export function BarraSuperior({
  izquierda,
  centro,
  derecha,
}: {
  izquierda?: ReactNode;
  centro: ReactNode;
  derecha?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="flex w-full items-center justify-between px-container-margin py-stack-gap-md">
        <div className="flex h-10 w-10 items-center justify-center">{izquierda}</div>
        {centro}
        <div className="flex h-10 w-10 items-center justify-center">{derecha}</div>
      </div>
    </header>
  );
}

// Boton redondo de icono, el que usan las barras superiores del diseño.
export function BotonIcono({
  onClick,
  etiqueta,
  children,
}: {
  onClick: () => void;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low"
    >
      {children}
    </button>
  );
}
