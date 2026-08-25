import { useEffect, useState } from "react";
import { categorias } from "../api/finanzas";
import type { Categoria, TipoMovimiento } from "../api/tipos";
import { ICONOS_DISPONIBLES } from "./iconosCategoria";
import { Icono } from "./Icono";

interface Props {
  tipoInicial: TipoMovimiento;
  alCerrar: () => void;
  alCrear: (creada: Categoria) => void;
}

// Panel que sube desde abajo (bottom sheet) para dar de alta una categoria.
export function ModalNuevaCategoria({ tipoInicial, alCerrar, alCrear }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoMovimiento>(tipoInicial);
  const [icono, setIcono] = useState<string>(ICONOS_DISPONIBLES[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape cierra, como en cualquier dialogo del sistema.
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") alCerrar();
    }
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [alCerrar]);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      const creada = await categorias.crear({ nombre: nombre.trim(), tipo, icono });
      alCrear(creada);
    } catch (e) {
      // La API valida lo mismo del lado del servidor; mostramos su mensaje.
      setError(e instanceof Error ? e.message : "No se pudo guardar la categoría.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-60 flex items-end justify-center bg-on-background/40 backdrop-blur-sm"
      onClick={alCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nueva categoría"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-[deslizarArriba_0.3s_ease-out] rounded-t-3xl bg-surface-container-lowest p-container-margin"
      >
        {/* Manija decorativa del panel */}
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-outline-variant" />

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline-lg text-headline-lg text-primary">Nueva Categoría</h2>
          <button type="button" onClick={alCerrar} className="p-2 text-on-surface-variant" aria-label="Cerrar">
            <Icono nombre="close" />
          </button>
        </div>

        <form onSubmit={guardar} className="flex flex-col gap-stack-gap-lg">
          <div className="flex flex-col gap-stack-gap-sm">
            <label
              htmlFor="nombre-categoria"
              className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
            >
              Nombre de categoría
            </label>
            <input
              id="nombre-categoria"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Suscripciones"
              maxLength={100}
              autoFocus
              className="w-full rounded-2xl border-none bg-surface-container-low p-4 font-body-md text-body-md text-primary outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>

          <div className="flex flex-col gap-stack-gap-sm">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Tipo
            </span>
            <SelectorTipo valor={tipo} alCambiar={setTipo} />
          </div>

          <div className="flex flex-col gap-stack-gap-sm">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Elegir ícono
            </span>
            <div className="grid grid-cols-4 gap-4">
              {ICONOS_DISPONIBLES.map((opcion) => {
                const elegido = opcion === icono;
                return (
                  <button
                    key={opcion}
                    type="button"
                    onClick={() => setIcono(opcion)}
                    aria-pressed={elegido}
                    aria-label={opcion}
                    className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                      elegido
                        ? "bg-primary-fixed text-primary-container ring-2 ring-primary"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    <Icono nombre={opcion} />
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-error-container p-3 font-body-md text-body-md text-on-error-container">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={guardando || nombre.trim() === ""}
            className="mt-4 w-full rounded-2xl bg-primary-container py-4 font-headline-md text-headline-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {guardando ? "Guardando…" : "Guardar Categoría"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Mismo control que las pestañas de la pantalla, reusado dentro del modal.
export function SelectorTipo({
  valor,
  alCambiar,
  plural = false,
}: {
  valor: TipoMovimiento;
  alCambiar: (tipo: TipoMovimiento) => void;
  plural?: boolean;
}) {
  return (
    <div className="flex rounded-xl bg-surface-container-low p-1">
      {(["Egreso", "Ingreso"] as const).map((opcion) => {
        const activo = opcion === valor;
        return (
          <button
            key={opcion}
            type="button"
            onClick={() => alCambiar(opcion)}
            aria-pressed={activo}
            className={`flex-1 rounded-lg py-2 text-center transition-all ${
              activo
                ? "bg-surface font-headline-md text-headline-md text-primary shadow-[0px_2px_8px_rgba(44,62,80,0.05)]"
                : "font-body-md text-body-md text-on-surface-variant hover:text-primary"
            }`}
          >
            {plural ? `${opcion}s` : opcion}
          </button>
        );
      })}
    </div>
  );
}
