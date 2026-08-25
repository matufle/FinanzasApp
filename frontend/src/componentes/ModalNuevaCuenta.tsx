import { useEffect, useState } from "react";
import { cuentas } from "../api/finanzas";
import type { Cuenta } from "../api/tipos";
import { Icono } from "./Icono";

interface Props {
  alCerrar: () => void;
  alCrear: (creada: Cuenta) => void;
}

export function ModalNuevaCuenta({ alCerrar, alCrear }: Props) {
  const [nombre, setNombre] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Un saldo vacio es una cuenta que arranca en cero, no un error.
      const creada = await cuentas.crear({
        nombre: nombre.trim(),
        saldoInicial: saldoInicial === "" ? 0 : Number(saldoInicial),
      });
      alCrear(creada);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0">
      <div
        className="absolute inset-0 bg-[rgba(22,40,57,0.4)] backdrop-blur-[4px]"
        onClick={alCerrar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nueva cuenta"
        className="relative flex w-full max-w-md animate-[deslizarArriba_0.3s_ease-out] flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-floating"
      >
        <form onSubmit={guardar} className="flex flex-col gap-stack-gap-lg px-container-margin py-stack-gap-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">Nueva cuenta</h2>
            <button
              type="button"
              onClick={alCerrar}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container-low"
            >
              <Icono nombre="close" className="text-[20px]!" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="nombre-cuenta"
                className="pl-1 font-label-caps text-label-caps uppercase text-outline"
              >
                Nombre
              </label>
              <input
                id="nombre-cuenta"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Billetera virtual"
                maxLength={100}
                autoFocus
                className="w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 font-body-md text-body-md text-primary transition-shadow outline-none placeholder:text-outline-variant focus:ring-2 focus:ring-primary-fixed-dim"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="saldo-inicial"
                className="pl-1 font-label-caps text-label-caps uppercase text-outline"
              >
                Saldo inicial
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 font-body-md text-body-md text-outline">
                  $
                </span>
                <input
                  id="saldo-inicial"
                  type="number"
                  step="0.01"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border-none bg-surface-container-low py-3 pr-4 pl-8 font-body-md text-body-md text-primary transition-shadow outline-none placeholder:text-outline-variant focus:ring-2 focus:ring-primary-fixed-dim"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-error-container p-3 font-body-md text-body-md text-on-error-container">
              {error}
            </p>
          )}

          <div className="flex gap-inline-gutter pt-2">
            <button
              type="button"
              onClick={alCerrar}
              className="flex-1 rounded-full bg-surface-container-low px-4 py-3 font-label-sm text-label-sm font-bold text-primary transition-colors hover:bg-surface-container-high"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || nombre.trim() === ""}
              className="flex-1 rounded-full bg-primary-container px-4 py-3 font-label-sm text-label-sm font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {guardando ? "Creando…" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
