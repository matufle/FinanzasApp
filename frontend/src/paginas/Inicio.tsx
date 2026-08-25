import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { categorias, cuentas, movimientos, reportes } from "../api/finanzas";
import type { Cuenta, Movimiento } from "../api/tipos";
import { usePeticion } from "../hooks/usePeticion";
import { Icono } from "../componentes/Icono";
import { Logo } from "../componentes/Logo";
import { BarraSuperior, Pantalla } from "../componentes/Pantalla";
import { iconoDe, iconoDeCuenta } from "../componentes/iconosCategoria";
import { formatearMonto, nombreMesAnio, rangoDelMes } from "../utilidades/formato";

const CUANTOS_ULTIMOS = 5;

export function Inicio() {
  const navegar = useNavigate();

  const [mes, setMes] = useState(() => {
    const ahora = new Date();
    return { anio: ahora.getFullYear(), mes: ahora.getMonth() };
  });

  const rango = rangoDelMes(mes.anio, mes.mes);
  const resumen = usePeticion(
    () => reportes.resumen(rango.desde, rango.hasta),
    [rango.desde, rango.hasta],
  );
  const ultimos = usePeticion(
    () => movimientos.listar(rango.desde, rango.hasta),
    [rango.desde, rango.hasta],
  );
  const listaCuentas = usePeticion(() => cuentas.listar(), []);
  const listaCategorias = usePeticion(() => categorias.listar(), []);

  const categoriaPorId = new Map((listaCategorias.datos ?? []).map((c) => [c.id, c]));

  const recientes = [...(ultimos.datos ?? [])]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, CUANTOS_ULTIMOS);

  function moverMes(pasos: number) {
    setMes((actual) => {
      const referencia = new Date(actual.anio, actual.mes + pasos, 1);
      return { anio: referencia.getFullYear(), mes: referencia.getMonth() };
    });
  }

  const esMesActual = mes.anio === new Date().getFullYear() && mes.mes === new Date().getMonth();
  const balance = resumen.datos?.balance ?? 0;

  return (
    <Pantalla
      activo="inicio"
      encabezado={
        <BarraSuperior
          izquierda={<Logo className="h-10 w-10" />}
          centro={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moverMes(-1)}
                aria-label="Mes anterior"
                className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low"
              >
                <Icono nombre="chevron_left" className="text-[20px]!" />
              </button>
              <h1 className="font-headline-md text-headline-md text-primary">
                {nombreMesAnio(mes.anio, mes.mes)}
              </h1>
              <button
                type="button"
                onClick={() => moverMes(1)}
                disabled={esMesActual}
                aria-label="Mes siguiente"
                className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low disabled:opacity-30"
              >
                <Icono nombre="chevron_right" className="text-[20px]!" />
              </button>
            </div>
          }
        />
      }
    >
      <div className="flex flex-col gap-stack-gap-lg px-container-margin pt-stack-gap-md pb-stack-gap-lg">
        <section className="flex flex-col gap-stack-gap-md">
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-6 text-center shadow-soft">
            <span className="mb-2 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
              Balance del mes
            </span>
            <span
              className={`font-display-currency text-display-currency ${
                balance < 0 ? "text-error" : "text-secondary"
              }`}
            >
              {resumen.cargando ? "—" : `$ ${formatearMonto(balance)}`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-inline-gutter">
            <TarjetaTotal
              titulo="Ingresos"
              monto={resumen.datos?.totalIngresos ?? 0}
              icono="arrow_upward"
              color="text-secondary"
              fondo="bg-secondary/10"
              cargando={resumen.cargando}
            />
            <TarjetaTotal
              titulo="Egresos"
              monto={resumen.datos?.totalEgresos ?? 0}
              icono="arrow_downward"
              color="text-error"
              fondo="bg-error/10"
              cargando={resumen.cargando}
            />
          </div>
        </section>

        <section className="flex flex-col gap-stack-gap-sm">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline-md text-[18px] text-primary">Mis cuentas</h2>
            <Link to="/cuentas" className="font-label-sm text-label-sm text-secondary hover:underline">
              Ver todas
            </Link>
          </div>

          {listaCuentas.datos?.length === 0 ? (
            <Link
              to="/cuentas"
              className="rounded-xl border-2 border-dashed border-outline-variant p-4 text-center font-body-md text-body-md text-outline"
            >
              Todavía no tenés cuentas. Crear la primera
            </Link>
          ) : (
            <div className="flex snap-x gap-inline-gutter overflow-x-auto pt-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {listaCuentas.datos?.map((cuenta) => (
                <TarjetaCuenta key={cuenta.id} cuenta={cuenta} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-stack-gap-sm">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-headline-md text-[18px] text-primary">Últimos movimientos</h2>
            <Link
              to="/movimientos"
              className="font-label-sm text-label-sm text-secondary hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {recientes.length === 0 && !ultimos.cargando ? (
            <p className="rounded-xl bg-surface-container-lowest p-6 text-center font-body-md text-body-md text-on-surface-variant shadow-soft">
              No hay movimientos en {nombreMesAnio(mes.anio, mes.mes).toLowerCase()}.
            </p>
          ) : (
            <div className="rounded-xl bg-surface-container-lowest p-2 shadow-soft">
              {recientes.map((movimiento) => (
                <FilaResumen
                  key={movimiento.id}
                  movimiento={movimiento}
                  icono={iconoDe(
                    categoriaPorId.get(movimiento.categoriaId) ?? {
                      nombre: movimiento.categoriaNombre,
                      icono: null,
                    },
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <button
        type="button"
        onClick={() => navegar("/movimientos/nuevo")}
        aria-label="Nuevo movimiento"
        className="fixed right-container-margin bottom-[88px] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-floating transition-transform hover:scale-105 active:scale-95 md:bottom-container-margin"
      >
        <Icono nombre="add" className="text-[28px]!" />
      </button>
    </Pantalla>
  );
}

function TarjetaTotal({
  titulo,
  monto,
  icono,
  color,
  fondo,
  cargando,
}: {
  titulo: string;
  monto: number;
  icono: string;
  color: string;
  fondo: string;
  cargando: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-4 text-center shadow-soft">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${fondo}`}>
        <Icono nombre={icono} className={`text-[18px]! ${color}`} />
      </div>
      <span className="mb-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        {titulo}
      </span>
      <span className={`font-headline-md text-[18px] ${color}`}>
        {cargando ? "—" : `$ ${formatearMonto(monto)}`}
      </span>
    </div>
  );
}

function TarjetaCuenta({ cuenta }: { cuenta: Cuenta }) {
  return (
    <Link
      to="/cuentas"
      className="flex min-w-[200px] snap-start flex-col gap-2 rounded-xl border border-surface-container-low bg-surface-container-lowest p-4 shadow-soft transition-colors hover:border-outline-variant"
    >
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Icono nombre={iconoDeCuenta(cuenta.nombre)} className="text-[20px]!" />
        <span className="font-label-sm text-label-sm font-semibold">{cuenta.nombre}</span>
      </div>
      <span className="font-headline-md text-[20px] text-primary">
        $ {formatearMonto(cuenta.saldoActual)}
      </span>
    </Link>
  );
}

function FilaResumen({ movimiento, icono }: { movimiento: Movimiento; icono: string }) {
  const esIngreso = movimiento.tipo === "Ingreso";

  return (
    <Link
      to="/movimientos"
      className="flex items-center justify-between rounded-lg border-b border-surface-container-low p-3 transition-colors last:border-0 hover:bg-surface-container-low"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            esIngreso ? "bg-secondary/10 text-secondary" : "bg-surface-variant text-primary"
          }`}
        >
          <Icono nombre={icono} relleno />
        </div>
        <div className="flex flex-col">
          <span className="font-body-md text-body-md font-semibold text-on-surface">
            {movimiento.descripcion || movimiento.categoriaNombre}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {movimiento.categoriaNombre}
          </span>
        </div>
      </div>
      <span
        className={`font-body-md text-body-md font-semibold ${
          esIngreso ? "text-secondary" : "text-error"
        }`}
      >
        {esIngreso ? "+" : "-"} $ {formatearMonto(movimiento.monto)}
      </span>
    </Link>
  );
}
