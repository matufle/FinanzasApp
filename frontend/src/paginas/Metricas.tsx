import { useState } from "react";
import { Link } from "react-router-dom";
import { categorias, reportes } from "../api/finanzas";
import type { Metricas as MetricasDto, Periodo, ResumenCategoria } from "../api/tipos";
import { usePeticion } from "../hooks/usePeticion";
import { Icono } from "../componentes/Icono";
import { BarraSuperior, Pantalla } from "../componentes/Pantalla";
import { iconoDe } from "../componentes/iconosCategoria";
import {
  formatearMonto,
  formatearPorcentaje,
  formatearVariacion,
  nombreMesAnio,
} from "../utilidades/formato";

// Cuantos meses pide el grafico de flujo de caja.
const MESES_DE_FLUJO = 6;

export function Metricas() {
  const [mes, setMes] = useState(() => {
    const ahora = new Date();
    return { anio: ahora.getFullYear(), mes: ahora.getMonth() };
  });

  // La Api numera los meses del 1 al 12; Date los numera del 0 al 11.
  const metricas = usePeticion(
    () => reportes.metricas(mes.anio, mes.mes + 1, undefined, MESES_DE_FLUJO),
    [mes.anio, mes.mes],
  );

  const listaCategorias = usePeticion(() => categorias.listar(), []);

  function moverMes(pasos: number) {
    setMes((actual) => {
      const referencia = new Date(actual.anio, actual.mes + pasos, 1);
      return { anio: referencia.getFullYear(), mes: referencia.getMonth() };
    });
  }

  const ahora = new Date();
  const esMesActual = mes.anio === ahora.getFullYear() && mes.mes === ahora.getMonth();

  const datos = metricas.datos;
  const mesVacio = datos !== null && datos.actual.ingresos === 0 && datos.actual.egresos === 0;

  return (
    <Pantalla
      activo="metricas"
      encabezado={
        <BarraSuperior
          centro={<h1 className="font-headline-md text-headline-md text-primary">Métricas</h1>}
        />
      }
    >
      <div className="flex flex-col gap-stack-gap-lg px-container-margin pt-stack-gap-sm pb-stack-gap-lg">
        <NavegadorDeMes
          etiqueta={nombreMesAnio(mes.anio, mes.mes)}
          alRetroceder={() => moverMes(-1)}
          alAvanzar={() => moverMes(1)}
          puedeAvanzar={!esMesActual}
        />

        {metricas.error !== null ? (
          <Aviso icono="error" texto={metricas.error} />
        ) : metricas.cargando || datos === null ? (
          <Aviso icono="hourglass_empty" texto="Calculando…" />
        ) : mesVacio ? (
          <SinDatos />
        ) : (
          <Contenido datos={datos} categorias={listaCategorias.datos ?? []} />
        )}
      </div>
    </Pantalla>
  );
}

function Contenido({
  datos,
  categorias: listaCategorias,
}: {
  datos: MetricasDto;
  categorias: { id: string; nombre: string; icono: string | null }[];
}) {
  const { actual, comparativa, proyeccion, tasaDeAhorro, flujoDeCaja, topEgresos } = datos;

  return (
    <>
      <TarjetaTasaDeAhorro tasa={tasaDeAhorro} balance={actual.balance} ingresos={actual.ingresos} />

      <div className="grid grid-cols-2 gap-inline-gutter">
        <TarjetaComparada
          titulo="Ingresos"
          monto={actual.ingresos}
          icono="arrow_downward"
          colorIcono="text-secondary"
          fondoIcono="bg-surface-variant"
          variacion={comparativa.variacionIngresos}
          diferencia={comparativa.diferenciaIngresos}
          // Que entre mas plata es una buena noticia.
          subirEsBueno
        />
        <TarjetaComparada
          titulo="Gastos"
          monto={actual.egresos}
          icono="arrow_upward"
          colorIcono="text-error"
          fondoIcono="bg-error-container/50"
          variacion={comparativa.variacionEgresos}
          diferencia={comparativa.diferenciaEgresos}
          subirEsBueno={false}
        />
      </div>

      <TarjetaProyeccion proyeccion={proyeccion} />

      <TarjetaFlujoDeCaja meses={flujoDeCaja} />

      <TarjetaCategorias categorias={topEgresos} total={actual.egresos} catalogo={listaCategorias} />
    </>
  );
}

function NavegadorDeMes({
  etiqueta,
  alRetroceder,
  alAvanzar,
  puedeAvanzar,
}: {
  etiqueta: string;
  alRetroceder: () => void;
  alAvanzar: () => void;
  puedeAvanzar: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-surface-container bg-surface-container-lowest p-3 shadow-soft">
      <button
        type="button"
        onClick={alRetroceder}
        aria-label="Mes anterior"
        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
      >
        <Icono nombre="chevron_left" />
      </button>
      <span className="font-headline-md text-headline-md tracking-tight text-primary">
        {etiqueta}
      </span>
      <button
        type="button"
        onClick={alAvanzar}
        disabled={!puedeAvanzar}
        aria-label="Mes siguiente"
        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-30"
      >
        <Icono nombre="chevron_right" />
      </button>
    </div>
  );
}

// El anillo se dibuja con un solo circulo al que se le "corta" el trazo:
// stroke-dasharray es la vuelta entera y stroke-dashoffset lo que queda sin
// pintar. Girarlo -90 grados hace que arranque arriba y no a la derecha.
const RADIO = 45;
const VUELTA = 2 * Math.PI * RADIO;

function TarjetaTasaDeAhorro({
  tasa,
  balance,
  ingresos,
}: {
  tasa: number | null;
  balance: number;
  ingresos: number;
}) {
  // Sin ingresos no hay tasa posible; con tasa negativa el anillo queda vacio
  // (no se puede pintar "menos que nada") y el numero se muestra en rojo.
  const proporcionPintada = tasa === null ? 0 : Math.min(Math.max(tasa, 0), 1);
  const enRojo = tasa !== null && tasa < 0;

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest p-stack-gap-lg shadow-soft">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-surface-variant/20 to-transparent" />

      <h2 className="z-10 mb-stack-gap-md font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        Tasa de ahorro
      </h2>

      <div className="relative z-10 mb-stack-gap-md flex h-48 w-48 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            className="stroke-surface-container"
            cx="50"
            cy="50"
            r={RADIO}
            fill="none"
            strokeWidth="8"
          />
          <circle
            className={enRojo ? "stroke-error" : "stroke-secondary"}
            cx="50"
            cy="50"
            r={RADIO}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={VUELTA}
            strokeDashoffset={VUELTA * (1 - proporcionPintada)}
          />
        </svg>
        <span
          className={`font-display-currency text-display-currency ${
            enRojo ? "text-error" : "text-primary"
          }`}
        >
          {tasa === null ? "—" : formatearPorcentaje(tasa)}
        </span>
      </div>

      <p className="z-10 text-center font-body-md text-body-md text-on-surface-variant">
        {tasa === null ? (
          "Este mes no entró plata, así que no hay tasa que calcular"
        ) : balance < 0 ? (
          <>
            Gastaste{" "}
            <span className="font-semibold text-error">$ {formatearMonto(-balance)}</span> más de lo
            que entró
          </>
        ) : (
          <>
            Ahorraste <span className="font-semibold text-on-surface">$ {formatearMonto(balance)}</span>{" "}
            de <span className="font-semibold text-on-surface">$ {formatearMonto(ingresos)}</span>
          </>
        )}
      </p>
    </section>
  );
}

function TarjetaComparada({
  titulo,
  monto,
  icono,
  colorIcono,
  fondoIcono,
  variacion,
  diferencia,
  subirEsBueno,
}: {
  titulo: string;
  monto: number;
  icono: string;
  colorIcono: string;
  fondoIcono: string;
  variacion: number | null;
  diferencia: number;
  subirEsBueno: boolean;
}) {
  // Que el numero suba no es bueno ni malo por si mismo: subir los ingresos
  // es una buena noticia y subir los gastos es una mala. De ahi 'subirEsBueno'.
  const subio = (variacion ?? diferencia) > 0;
  const sinCambios = (variacion ?? diferencia) === 0;
  const favorable = subio === subirEsBueno;

  const clasesChip = sinCambios
    ? "text-on-surface-variant bg-surface-container"
    : favorable
      ? "text-secondary bg-secondary-container/20"
      : "text-error bg-error-container/40";

  return (
    <div className="flex flex-col rounded-xl border border-surface-container bg-surface-container-lowest p-stack-gap-md shadow-soft">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${fondoIcono}`}>
          <Icono nombre={icono} className={`text-[18px]! ${colorIcono}`} />
        </div>
        <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          {titulo}
        </span>
      </div>

      {/* En dos columnas la tarjeta queda angosta y "$ 480.000,00" se parte en
          dos renglones. Se usa el mismo 18px que las tarjetas de Inicio y se
          prohibe el corte, que es mas legible que un monto en dos lineas. */}
      <span className="mt-1 font-headline-md text-[18px] whitespace-nowrap text-primary">
        $ {formatearMonto(monto)}
      </span>

      {/* El "vs mes anterior" va como pie y no adentro de la pastilla: con la
          tarjeta a media pantalla, meter todo junto parte el texto en dos
          renglones o se desborda cuando en vez del porcentaje va un monto. */}
      <div className={`mt-2 flex w-fit items-center gap-1 rounded-lg px-2 py-1 ${clasesChip}`}>
        <Icono
          nombre={sinCambios ? "remove" : subio ? "trending_up" : "trending_down"}
          className="text-[14px]!"
        />
        <span className="font-label-sm text-label-sm font-semibold whitespace-nowrap">
          {/* Sin mes anterior con que dividir no hay porcentaje: se muestra
              la diferencia en plata, que igual dice lo que hace falta saber. */}
          {variacion === null
            ? `${diferencia > 0 ? "+" : ""}$ ${formatearMonto(diferencia)}`
            : formatearVariacion(variacion)}
        </span>
      </div>
      <span className="mt-1 font-label-sm text-[11px] text-on-surface-variant">
        vs. mes anterior
      </span>
    </div>
  );
}

function TarjetaProyeccion({
  proyeccion,
}: {
  proyeccion: MetricasDto["proyeccion"];
}) {
  const mesTerminado = proyeccion.diasTranscurridos >= proyeccion.diasDelMes;

  return (
    <section className="relative overflow-hidden rounded-xl bg-primary p-stack-gap-lg text-on-primary shadow-floating">
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary-fixed-dim/20 blur-2xl" />

      <h2 className="mb-2 font-label-caps text-label-caps uppercase tracking-wider text-on-primary-container opacity-80">
        Proyección a fin de mes
      </h2>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-headline-lg text-headline-lg">
          $ {formatearMonto(proyeccion.egresosProyectados)}
        </span>
        <span className="font-label-sm text-label-sm text-on-primary-container">
          {mesTerminado ? "gastados" : "gastos est."}
        </span>
      </div>

      <p className="mb-4 font-body-md text-body-md text-on-primary-container">
        {mesTerminado
          ? "El mes ya cerró: esto es lo que gastaste."
          : `Si seguís a este ritmo, promediando $ ${formatearMonto(
              proyeccion.promedioDiarioEgresos,
            )} por día.`}
      </p>

      {!mesTerminado && (
        <div className="flex items-center gap-3 rounded-lg border-l-4 border-secondary bg-surface-container-lowest p-3 text-on-surface">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icono nombre="calendar_today" className="text-[18px]!" />
          </div>
          <div>
            <span className="block font-label-caps text-label-caps uppercase text-on-surface-variant">
              Te quedan
            </span>
            <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
              $ {formatearMonto(proyeccion.disponiblePorDia)}{" "}
              <span className="font-body-md text-body-md font-normal text-on-surface-variant">
                por día
              </span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function TarjetaFlujoDeCaja({ meses }: { meses: Periodo[] }) {
  // Todas las barras se miden contra el mes mas alto de la ventana, asi las
  // alturas son comparables entre si. Si no hubo nada, el maximo es 1 para no
  // dividir por cero.
  const maximo = Math.max(1, ...meses.flatMap((m) => [m.ingresos, m.egresos]));
  const ultimo = meses.length - 1;

  return (
    <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-stack-gap-md shadow-soft">
      <div className="mb-stack-gap-lg flex items-center justify-between">
        <h2 className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          Flujo de caja
        </h2>
        <div className="flex gap-3">
          <Referencia color="bg-secondary" texto="Ingresos" />
          <Referencia color="bg-error" texto="Gastos" />
        </div>
      </div>

      <div className="flex h-40 items-end justify-between border-b border-outline-variant px-1 pt-4 pb-2">
        {meses.map((mes) => (
          <div key={mes.etiqueta} className="flex h-full w-full items-end justify-center gap-1">
            <Barra color="bg-secondary" alto={mes.ingresos / maximo} titulo={`Ingresos: $ ${formatearMonto(mes.ingresos)}`} />
            <Barra color="bg-error" alto={mes.egresos / maximo} titulo={`Gastos: $ ${formatearMonto(mes.egresos)}`} />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between px-1">
        {meses.map((mes, indice) => (
          <span
            key={mes.etiqueta}
            className={`w-full text-center font-label-caps text-label-caps ${
              indice === ultimo ? "font-bold text-primary" : "text-on-surface-variant"
            }`}
          >
            {/* La etiqueta viene como "ago 2026"; en el eje alcanza el mes. */}
            {mes.etiqueta.split(" ")[0]}
          </span>
        ))}
      </div>
    </section>
  );
}

function Barra({ color, alto, titulo }: { color: string; alto: number; titulo: string }) {
  return (
    <div
      title={titulo}
      // El minimo de 2px deja una marca visible en los meses en cero, para que
      // se note que la columna existe y no parezca que falta el dato.
      style={{ height: `max(2px, ${alto * 100}%)` }}
      className={`w-3 cursor-default rounded-t-sm transition-all hover:brightness-110 ${color}`}
    />
  );
}

function Referencia({ color, texto }: { color: string; texto: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`h-3 w-3 rounded-sm ${color}`} />
      <span className="font-label-sm text-label-sm text-on-surface-variant">{texto}</span>
    </div>
  );
}

function TarjetaCategorias({
  categorias: lista,
  total,
  catalogo,
}: {
  categorias: ResumenCategoria[];
  total: number;
  catalogo: { id: string; nombre: string; icono: string | null }[];
}) {
  // ResumenCategoria no trae el icono, asi que se cruza contra el listado de
  // categorias igual que en la lista de movimientos.
  const porId = new Map(catalogo.map((c) => [c.id, c]));

  if (lista.length === 0) {
    return (
      <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-stack-gap-md shadow-soft">
        <h2 className="mb-stack-gap-md font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
          En qué se te fue
        </h2>
        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          Este mes no registraste ningún gasto.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-surface-container bg-surface-container-lowest p-stack-gap-md shadow-soft">
      <h2 className="mb-stack-gap-md font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
        En qué se te fue
      </h2>

      <div className="space-y-4">
        {lista.map((categoria) => {
          const proporcion = total > 0 ? categoria.total / total : 0;
          const icono = iconoDe(
            porId.get(categoria.categoriaId) ?? {
              nombre: categoria.categoriaNombre,
              icono: null,
            },
          );

          return (
            <div key={categoria.categoriaId}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant text-primary">
                    <Icono nombre={icono} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md font-semibold text-primary">
                      {categoria.categoriaNombre}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {formatearPorcentaje(proporcion)} del gasto
                    </span>
                  </div>
                </div>
                <span className="font-body-md text-body-md font-semibold text-primary">
                  $ {formatearMonto(categoria.total)}
                </span>
              </div>

              <div className="ml-[52px] h-1.5 max-w-[calc(100%-52px)] overflow-hidden rounded-full bg-surface-variant">
                <div
                  className="h-full rounded-full bg-primary-container"
                  style={{ width: `${proporcion * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Aviso({ icono, texto }: { icono: string; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-8 text-center shadow-soft">
      <Icono nombre={icono} className="text-[28px]! text-outline" />
      <p className="font-body-md text-body-md text-on-surface-variant">{texto}</p>
    </div>
  );
}

// Estado vacio: el mes existe pero todavia no tiene un solo movimiento.
// Mostrar las tarjetas todas en cero seria peor que no mostrar nada.
function SinDatos() {
  return (
    <div className="mx-auto flex w-full max-w-[280px] flex-col items-center justify-center py-12 opacity-80">
      <div className="mb-stack-gap-lg h-48 w-48">
        <svg className="h-full w-full" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <path
            d="M100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180Z"
            stroke="#D4E4FA"
            strokeDasharray="10 10"
            strokeWidth="4"
          />
          <path
            d="M100 150C127.614 150 150 127.614 150 100C150 72.3858 127.614 50 100 50C72.3858 50 50 72.3858 50 100C50 127.614 72.3858 150 100 150Z"
            stroke="#EDF2F7"
            strokeWidth="2"
          />
          <path
            d="M60 110L85 85L110 100L140 65"
            stroke="#B5C8DF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6"
          />
          <circle cx="140" cy="65" fill="#162839" r="6" />
          <rect fill="#E5EFFF" height="30" rx="4" width="12" x="70" y="120" />
          <rect fill="#D4E4FA" height="40" rx="4" width="12" x="95" y="110" />
          <rect fill="#B5C8DF" height="60" rx="4" width="12" x="120" y="90" />
        </svg>
      </div>

      <p className="text-center font-body-md text-body-md text-outline">
        Todavía no hay datos de este mes
      </p>

      <Link
        to="/movimientos/nuevo"
        className="mt-stack-gap-lg flex items-center gap-2 rounded-full bg-surface-container px-6 py-3 font-label-sm text-label-sm text-primary transition-colors hover:bg-surface-variant active:scale-95"
      >
        <Icono nombre="add" className="text-[18px]!" />
        <span>Cargar un movimiento</span>
      </Link>
    </div>
  );
}
