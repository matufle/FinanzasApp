import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categorias, cuentas, movimientos } from "../api/finanzas";
import type { Movimiento, TipoMovimiento } from "../api/tipos";
import { usePeticion } from "../hooks/usePeticion";
import { Icono } from "../componentes/Icono";
import { Logo } from "../componentes/Logo";
import { BarraSuperior, BotonIcono, Pantalla } from "../componentes/Pantalla";
import { iconoDe } from "../componentes/iconosCategoria";
import {
  etiquetaDia,
  etiquetaMes,
  formatearMonto,
  isoDeFecha,
  rangoDelMes,
  soloFecha,
} from "../utilidades/formato";

type Filtro = "Todos" | TipoMovimiento;

export function Movimientos() {
  const navegar = useNavigate();
  const hoy = isoDeFecha(new Date());

  // El mes que se esta mirando. La Api filtra por rango de fechas, asi que
  // moverse de mes es volver a pedir con otro desde/hasta.
  const [mes, setMes] = useState(() => {
    const ahora = new Date();
    return { anio: ahora.getFullYear(), mes: ahora.getMonth() };
  });
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [cuentaFiltro, setCuentaFiltro] = useState<string>("");

  const rango = rangoDelMes(mes.anio, mes.mes);
  const lista = usePeticion(
    () => movimientos.listar(rango.desde, rango.hasta),
    [rango.desde, rango.hasta],
  );
  const listaCuentas = usePeticion(() => cuentas.listar(), []);
  const listaCategorias = usePeticion(() => categorias.listar(), []);

  // El movimiento trae el nombre de la categoria pero no su icono, asi que se
  // busca en el listado de categorias por id.
  const categoriaPorId = new Map((listaCategorias.datos ?? []).map((c) => [c.id, c]));

  // Los filtros de tipo y cuenta se aplican en memoria: el mes ya vino acotado
  // desde la Api y son pocos registros.
  const visibles = (lista.datos ?? [])
    .filter((m) => filtro === "Todos" || m.tipo === filtro)
    .filter((m) => cuentaFiltro === "" || m.cuentaId === cuentaFiltro)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Agrupados por dia, conservando el orden de mas nuevo a mas viejo.
  const porDia = new Map<string, Movimiento[]>();
  for (const movimiento of visibles) {
    const dia = soloFecha(movimiento.fecha);
    const grupo = porDia.get(dia);
    if (grupo) grupo.push(movimiento);
    else porDia.set(dia, [movimiento]);
  }

  function moverMes(pasos: number) {
    setMes((actual) => {
      const referencia = new Date(actual.anio, actual.mes + pasos, 1);
      return { anio: referencia.getFullYear(), mes: referencia.getMonth() };
    });
  }

  const esMesActual =
    mes.anio === new Date().getFullYear() && mes.mes === new Date().getMonth();

  return (
    <Pantalla
      activo="movimientos"
      encabezado={
        <BarraSuperior
          izquierda={<Logo className="h-8 w-8" />}
          centro={
            <h1 className="font-headline-md text-headline-md text-primary">Movimientos</h1>
          }
          derecha={
            <BotonIcono onClick={() => navegar("/movimientos/nuevo")} etiqueta="Nuevo movimiento">
              <Icono nombre="add" />
            </BotonIcono>
          }
        />
      }
    >
      <div className="px-container-margin">
        <section className="mb-stack-gap-lg">
          <div className="-mx-container-margin flex gap-2 overflow-x-auto px-container-margin py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["Todos", "Ingreso", "Egreso"] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setFiltro(opcion)}
                aria-pressed={filtro === opcion}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-label-sm text-label-sm transition-colors active:scale-95 ${
                  filtro === opcion
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                {opcion === "Todos" ? "Todos" : `${opcion}s`}
              </button>
            ))}

            {/* El filtro de cuenta es un <select> disfrazado de chip: asi el
                desplegable lo dibuja el sistema y funciona igual en celular. */}
            <div className="relative">
              <select
                value={cuentaFiltro}
                onChange={(e) => setCuentaFiltro(e.target.value)}
                aria-label="Filtrar por cuenta"
                className={`appearance-none rounded-full py-2 pr-8 pl-4 font-label-sm text-label-sm transition-colors ${
                  cuentaFiltro === ""
                    ? "bg-surface-container-highest text-on-surface-variant"
                    : "bg-primary text-on-primary"
                }`}
              >
                <option value="">Cuenta</option>
                {listaCuentas.datos?.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre}
                  </option>
                ))}
              </select>
              <Icono
                nombre="arrow_drop_down"
                className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[16px]!"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 shadow-soft">
            <button
              type="button"
              onClick={() => moverMes(-1)}
              aria-label="Mes anterior"
              className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <Icono nombre="chevron_left" className="text-[20px]!" />
            </button>

            <span className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
              <Icono nombre="calendar_today" className="text-[18px]!" />
              {etiquetaMes(mes.anio, mes.mes)}
            </span>

            <button
              type="button"
              onClick={() => moverMes(1)}
              disabled={esMesActual}
              aria-label="Mes siguiente"
              className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
            >
              <Icono nombre="chevron_right" className="text-[20px]!" />
            </button>
          </div>
        </section>

        {lista.error && (
          <div className="rounded-xl bg-error-container p-4 font-body-md text-body-md text-on-error-container">
            <p>{lista.error}</p>
            <button type="button" onClick={lista.recargar} className="mt-2 underline">
              Reintentar
            </button>
          </div>
        )}

        {lista.cargando && (
          <p className="py-8 text-center font-body-md text-body-md text-on-surface-variant">
            Cargando movimientos…
          </p>
        )}

        {!lista.cargando && !lista.error && visibles.length === 0 && (
          <p className="py-8 text-center font-body-md text-body-md text-on-surface-variant">
            No hay movimientos en este período.
          </p>
        )}

        <section className="space-y-6 pb-4">
          {[...porDia.entries()].map(([dia, delDia]) => (
            <div key={dia}>
              <h2 className="mb-stack-gap-sm px-2 font-label-caps text-label-caps text-on-surface-variant">
                {etiquetaDia(dia, hoy)}
              </h2>
              <div className="space-y-3">
                {delDia.map((movimiento) => (
                  <FilaMovimiento
                    key={movimiento.id}
                    movimiento={movimiento}
                    icono={iconoDe(
                      categoriaPorId.get(movimiento.categoriaId) ?? {
                        nombre: movimiento.categoriaNombre,
                        icono: null,
                      },
                    )}
                    alAnular={lista.recargar}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </Pantalla>
  );
}

const CORRIMIENTO = 72; // cuanto se corre la fila para dejar ver el boton rojo

function FilaMovimiento({
  movimiento,
  icono,
  alAnular,
}: {
  movimiento: Movimiento;
  icono: string;
  alAnular: () => void;
}) {
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [anulando, setAnulando] = useState(false);
  const inicioX = useRef<number | null>(null);
  const desplazamientoInicial = useRef(0);

  const esIngreso = movimiento.tipo === "Ingreso";

  // Arrastrar la fila hacia la izquierda destapa el boton de borrar. Se usa
  // pointer en vez de touch para que ande igual con el mouse en escritorio.
  function alEmpezar(evento: React.PointerEvent) {
    inicioX.current = evento.clientX;
    desplazamientoInicial.current = desplazamiento;
  }

  function alMover(evento: React.PointerEvent) {
    if (inicioX.current === null) return;
    const arrastre = desplazamientoInicial.current + (evento.clientX - inicioX.current);
    setDesplazamiento(Math.min(0, Math.max(-CORRIMIENTO, arrastre)));
  }

  function alSoltar() {
    if (inicioX.current === null) return;
    inicioX.current = null;
    // Se queda abierta o cerrada segun haya pasado la mitad del recorrido.
    setDesplazamiento((actual) => (actual < -CORRIMIENTO / 2 ? -CORRIMIENTO : 0));
  }

  async function anular() {
    setAnulando(true);
    try {
      await movimientos.anular(movimiento.id);
      alAnular();
    } finally {
      setAnulando(false);
      setDesplazamiento(0);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl shadow-soft">
      <button
        type="button"
        onClick={anular}
        disabled={anulando}
        aria-label={`Anular ${movimiento.descripcion || movimiento.categoriaNombre}`}
        tabIndex={desplazamiento === 0 ? -1 : 0}
        className="absolute inset-0 flex items-center justify-end bg-error px-6 text-on-error"
      >
        <Icono nombre="delete" relleno />
      </button>

      <div
        onPointerDown={alEmpezar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        style={{ transform: `translateX(${desplazamiento}px)` }}
        className="relative flex touch-pan-y items-center justify-between bg-surface-container-lowest p-4 transition-transform select-none"
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              esIngreso
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-variant text-primary"
            }`}
          >
            <Icono nombre={icono} relleno />
          </div>
          <div>
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              {movimiento.descripcion || movimiento.categoriaNombre}
            </p>
            <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
              {movimiento.categoriaNombre} • {movimiento.cuentaNombre}
            </p>
          </div>
        </div>

        <p
          className={`text-right font-body-md text-body-md font-semibold ${
            esIngreso ? "text-secondary" : "text-error"
          }`}
        >
          {esIngreso ? "+" : "-"}$ {formatearMonto(movimiento.monto)}
        </p>
      </div>
    </div>
  );
}
