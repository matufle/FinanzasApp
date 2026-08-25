import { Link } from "react-router-dom";
import { Icono } from "./Icono";

export type Seccion = "inicio" | "movimientos" | "metricas" | "cuentas" | "ajustes";

interface Item {
  clave: Seccion;
  etiqueta: string;
  icono: string;
  // ruta en null = la pantalla todavia no existe. Se muestra apagada en vez de
  // llevar a una pagina en blanco; cuando se cree, se completa la ruta y listo.
  ruta: string | null;
}

const ITEMS: Item[] = [
  { clave: "inicio", etiqueta: "Inicio", icono: "home", ruta: "/" },
  { clave: "movimientos", etiqueta: "Movimientos", icono: "receipt_long", ruta: "/movimientos" },
  { clave: "metricas", etiqueta: "Métricas", icono: "monitoring", ruta: "/metricas" },
  { clave: "cuentas", etiqueta: "Cuentas", icono: "account_balance_wallet", ruta: "/cuentas" },
  { clave: "ajustes", etiqueta: "Ajustes", icono: "settings", ruta: "/ajustes" },
];

// Un item puede ser un Link (hay ruta), un boton apagado (todavia no existe)
// o el destino actual. Estas dos funciones deciden cual de los tres es.
function esNavegable(item: Item, activo: Seccion) {
  return item.ruta !== null && item.clave !== activo;
}

function esApagado(item: Item, activo: Seccion) {
  return item.ruta === null && item.clave !== activo;
}

// Barra inferior: solo en celular. En escritorio la reemplaza el menu lateral.
export function NavegacionInferior({ activo }: { activo: Seccion }) {
  return (
    <nav className="fixed bottom-0 z-40 w-full rounded-t-xl bg-surface-container-lowest pt-2 pb-safe-bottom shadow-[0px_-4px_20px_rgba(44,62,80,0.05)] md:hidden">
      <div className="flex h-[64px] items-center justify-around px-1">
        {ITEMS.map((item) => {
          const esActivo = item.clave === activo;

          const contenido = (
            <>
              {/* Pastilla verde detras del icono del destino actual */}
              {esActivo && (
                <div className="absolute top-1/2 left-1/2 z-0 h-8 w-14 -translate-x-1/2 -translate-y-[18px] scale-90 rounded-full bg-secondary-container/30" />
              )}
              <Icono nombre={item.icono} relleno={esActivo} className="relative z-10 mb-1" />
              <span className="relative z-10 font-label-sm text-[11px]">{item.etiqueta}</span>
            </>
          );

          const clases = `relative flex h-16 w-full max-w-[72px] flex-col items-center justify-center rounded-xl transition-colors ${
            esActivo
              ? "text-secondary font-bold"
              : esApagado(item, activo)
                ? "text-on-surface-variant/40 cursor-not-allowed"
                : "text-on-surface-variant hover:bg-surface-container-low"
          }`;

          if (esNavegable(item, activo)) {
            return (
              <Link key={item.clave} to={item.ruta!} className={clases}>
                {contenido}
              </Link>
            );
          }

          return (
            <button
              key={item.clave}
              type="button"
              disabled={!esActivo}
              aria-current={esActivo ? "page" : undefined}
              title={esApagado(item, activo) ? "Todavia no esta hecha" : undefined}
              className={clases}
            >
              {contenido}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Menu lateral: solo en escritorio (md hacia arriba).
export function NavegacionLateral({ activo }: { activo: Seccion }) {
  return (
    <aside className="fixed top-0 bottom-0 left-0 z-30 hidden w-64 flex-col border-r border-surface-container bg-surface-container-lowest pt-[80px] md:flex">
      <div className="mt-8 flex flex-col gap-2 px-4">
        {ITEMS.map((item) => {
          const esActivo = item.clave === activo;

          const contenido = (
            <>
              <Icono nombre={item.icono} relleno={esActivo} />
              <span className="font-label-sm text-label-sm font-bold">{item.etiqueta}</span>
            </>
          );

          const clases = `flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${
            esActivo
              ? "bg-secondary-container/20 text-secondary font-bold hover:bg-secondary-container/30"
              : esApagado(item, activo)
                ? "text-on-surface-variant/40 cursor-not-allowed"
                : "text-on-surface-variant hover:bg-surface-container-low"
          }`;

          if (esNavegable(item, activo)) {
            return (
              <Link key={item.clave} to={item.ruta!} className={clases}>
                {contenido}
              </Link>
            );
          }

          return (
            <button
              key={item.clave}
              type="button"
              disabled={!esActivo}
              aria-current={esActivo ? "page" : undefined}
              title={esApagado(item, activo) ? "Todavia no esta hecha" : undefined}
              className={clases}
            >
              {contenido}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
