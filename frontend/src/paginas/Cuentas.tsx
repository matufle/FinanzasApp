import { useState } from "react";
import { cuentas } from "../api/finanzas";
import type { Cuenta } from "../api/tipos";
import { usePeticion } from "../hooks/usePeticion";
import { Icono } from "../componentes/Icono";
import { Logo } from "../componentes/Logo";
import { BarraSuperior, BotonIcono, Pantalla } from "../componentes/Pantalla";
import { ModalNuevaCuenta } from "../componentes/ModalNuevaCuenta";
import { formatearMonto, formatearMontoConSimbolo } from "../utilidades/formato";

export function Cuentas() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const lista = usePeticion(() => cuentas.listar(), []);

  // El patrimonio no lo calcula la API: es la suma de los saldos actuales,
  // que ya vienen calculados cuenta por cuenta.
  const patrimonio = (lista.datos ?? []).reduce((total, c) => total + c.saldoActual, 0);

  return (
    <Pantalla
      activo="cuentas"
      encabezado={
        <BarraSuperior
          centro={
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <h1 className="font-headline-md text-headline-md tracking-tight text-primary">
                Mis Cuentas
              </h1>
            </div>
          }
          derecha={
            <BotonIcono onClick={() => setModalAbierto(true)} etiqueta="Nueva cuenta">
              <Icono nombre="add_circle" />
            </BotonIcono>
          }
        />
      }
    >
      <div className="flex flex-col gap-stack-gap-lg px-container-margin pt-4 pb-stack-gap-lg">
        <section className="relative overflow-hidden rounded-3xl bg-primary-container p-stack-gap-lg text-on-primary shadow-floating">
          <div className="absolute -top-10 -right-10 opacity-10">
            <Icono nombre="savings" className="text-[150px]!" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="mb-2 font-label-caps text-label-caps uppercase tracking-wider text-on-primary-container">
              Patrimonio Total
            </h2>
            <div className="flex items-start justify-center gap-1">
              <span className="mt-1 font-headline-md text-headline-md">$</span>
              <span className="font-display-currency text-display-currency">
                {lista.cargando ? "—" : formatearMonto(patrimonio)}
              </span>
            </div>
          </div>
        </section>

        {lista.error && (
          <div className="rounded-2xl bg-error-container p-4 font-body-md text-body-md text-on-error-container">
            <p>{lista.error}</p>
            <button type="button" onClick={lista.recargar} className="mt-2 underline">
              Reintentar
            </button>
          </div>
        )}

        <section className="flex flex-col gap-stack-gap-md">
          {lista.datos?.map((cuenta) => (
            <TarjetaCuenta key={cuenta.id} cuenta={cuenta} alCambiar={lista.recargar} />
          ))}

          {lista.datos?.length === 0 && (
            <p className="text-center font-body-md text-body-md text-on-surface-variant">
              Todavía no tenés ninguna cuenta.
            </p>
          )}

          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant p-stack-gap-md text-outline transition-all duration-200 hover:border-primary hover:bg-surface-container-low hover:text-primary"
          >
            <Icono nombre="add" />
            <span className="font-body-md text-body-md font-medium">Agregar cuenta</span>
          </button>
        </section>
      </div>

      {modalAbierto && (
        <ModalNuevaCuenta
          alCerrar={() => setModalAbierto(false)}
          alCrear={() => {
            setModalAbierto(false);
            lista.recargar();
          }}
        />
      )}
    </Pantalla>
  );
}

function TarjetaCuenta({ cuenta, alCambiar }: { cuenta: Cuenta; alCambiar: () => void }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cerrarMenu() {
    setMenuAbierto(false);
    setConfirmando(false);
  }

  async function darDeBaja() {
    setError(null);
    try {
      await cuentas.darDeBaja(cuenta.id);
      cerrarMenu();
      alCambiar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo dar de baja.");
    }
  }

  return (
    <article className="flex items-center justify-between rounded-2xl border border-surface-container-low bg-surface-container-lowest p-stack-gap-md shadow-soft transition-colors hover:border-outline-variant">
      <div className="flex flex-col gap-1">
        <span className="font-headline-md text-headline-md text-primary">
          {formatearMontoConSimbolo(cuenta.saldoActual)}
        </span>
        <h3 className="font-body-md text-body-md font-medium text-primary-container">
          {cuenta.nombre}
        </h3>
        <p className="font-label-sm text-label-sm text-outline">
          Saldo inicial: {formatearMontoConSimbolo(cuenta.saldoInicial)}
        </p>
        {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
      </div>

      <div className="relative -mt-2 -mr-2 self-start">
        <button
          type="button"
          onClick={() => (menuAbierto ? cerrarMenu() : setMenuAbierto(true))}
          aria-label={`Acciones de ${cuenta.nombre}`}
          aria-expanded={menuAbierto}
          className="flex h-10 w-10 items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container hover:text-primary"
        >
          <Icono nombre="more_vert" />
        </button>

        {menuAbierto && (
          <>
            {/* Capa invisible: un clic en cualquier otro lado cierra el menu. */}
            <div className="fixed inset-0 z-10" onClick={cerrarMenu} />
            <div className="absolute top-11 right-0 z-20 w-56 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-floating">
              {confirmando ? (
                <div className="flex flex-col gap-2">
                  <p className="px-1 font-label-sm text-label-sm text-on-surface-variant">
                    ¿Dar de baja {cuenta.nombre}? Deja de aparecer, pero sus movimientos
                    quedan guardados.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cerrarMenu}
                      className="flex-1 rounded-full bg-surface-container-low px-3 py-2 font-label-sm text-label-sm font-bold text-primary"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={darDeBaja}
                      className="flex-1 rounded-full bg-error px-3 py-2 font-label-sm text-label-sm font-bold text-on-error"
                    >
                      Sí, dar de baja
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-label-sm text-label-sm text-error transition-colors hover:bg-error-container"
                >
                  <Icono nombre="delete" className="text-[20px]!" />
                  Dar de baja
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
