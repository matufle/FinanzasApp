import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { categorias, cuentas, movimientos } from "../api/finanzas";
import type { TipoMovimiento } from "../api/tipos";
import { usePeticion } from "../hooks/usePeticion";
import { Icono } from "../componentes/Icono";
import { iconoDe } from "../componentes/iconosCategoria";

// Cada tipo de movimiento pinta la pantalla entera: el monto, la pestaña
// elegida y el chip de categoria. Tenerlo en un solo lugar evita que se
// desincronicen los tres.
const ESTILOS = {
  Egreso: {
    texto: "text-error",
    sombraPestana: "shadow-[0px_2px_8px_rgba(186,26,26,0.15)]",
    chipActivo: "bg-error-container border-error-container text-on-error-container",
  },
  Ingreso: {
    texto: "text-secondary",
    sombraPestana: "shadow-[0px_2px_8px_rgba(0,109,55,0.15)]",
    chipActivo: "bg-secondary-container border-secondary-container text-on-secondary-container",
  },
} as const;

// La fecha viaja como "2026-08-25" sin hora ni zona. Mandar un ISO completo
// haria que un movimiento de la noche cayera en el dia siguiente en UTC.
function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

// Deja escribir solo numeros con un separador decimal y dos decimales.
// Acepta punto o coma porque en el celular el teclado numerico da uno u otro.
function normalizarMonto(texto: string): string {
  const soloValidos = texto.replace(/[^\d.,]/g, "");
  const partes = soloValidos.split(/[.,]/);

  if (partes.length === 1) return partes[0];

  return `${partes[0]},${partes.slice(1).join("").slice(0, 2)}`;
}

export function NuevoMovimiento() {
  const navegar = useNavigate();

  const [tipo, setTipo] = useState<TipoMovimiento>("Egreso");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const [fecha, setFecha] = useState(hoyIso);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listaCategorias = usePeticion(() => categorias.listar(), []);
  const listaCuentas = usePeticion(() => cuentas.listar(), []);

  const estilos = ESTILOS[tipo];

  // La Api rechaza un movimiento cuyo tipo no coincida con el de su categoria,
  // asi que directamente solo se ofrecen las categorias del tipo elegido.
  const categoriasDelTipo = (listaCategorias.datos ?? []).filter((c) => c.tipo === tipo);

  // Sin eleccion explicita se usa la primera cuenta, que es el caso normal.
  const cuentaElegida = cuentaId ?? listaCuentas.datos?.[0]?.id ?? "";
  const montoNumero = Number(monto.replace(",", "."));
  const puedeGuardar =
    montoNumero > 0 && categoriaId !== null && cuentaElegida !== "" && !guardando;

  function cambiarTipo(nuevo: TipoMovimiento) {
    setTipo(nuevo);
    // La categoria elegida pertenece al tipo anterior: deja de valer.
    setCategoriaId(null);
  }

  async function guardar(evento?: React.FormEvent) {
    evento?.preventDefault();
    if (!puedeGuardar) return;

    setGuardando(true);
    setError(null);

    try {
      await movimientos.crear({
        monto: montoNumero,
        tipo,
        fecha,
        descripcion: descripcion.trim(),
        cuentaId: cuentaElegida,
        categoriaId: categoriaId!,
      });
      navegar("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el movimiento.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] justify-center bg-background text-on-background antialiased">
      <form
        onSubmit={guardar}
        className="relative flex min-h-[100dvh] w-full max-w-[390px] flex-col bg-background"
      >
        {/* Flujo transaccional: sin navegacion, solo salir o guardar. */}
        <header className="sticky top-0 z-10 flex w-full items-center justify-between bg-background px-container-margin py-stack-gap-sm">
          <button
            type="button"
            onClick={() => navegar(-1)}
            aria-label="Cancelar"
            className="-ml-2 p-2 text-on-surface-variant transition-opacity hover:opacity-80 active:scale-95"
          >
            <Icono nombre="close" />
          </button>
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="font-headline-md text-headline-md text-primary transition-opacity hover:opacity-80 active:scale-95 disabled:opacity-40"
          >
            Guardar
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-stack-gap-lg overflow-y-auto px-container-margin pt-4 pb-24">
          <div className="flex w-full rounded-full bg-surface-container p-1 shadow-sm">
            {(["Ingreso", "Egreso"] as const).map((opcion) => {
              const activo = opcion === tipo;
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => cambiarTipo(opcion)}
                  aria-pressed={activo}
                  className={`flex-1 rounded-full py-2.5 font-label-sm text-label-sm transition-all ${
                    activo
                      ? `bg-surface-container-lowest font-bold ${ESTILOS[opcion].texto} ${ESTILOS[opcion].sombraPestana}`
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {opcion}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="flex items-baseline gap-1">
              <span className={`font-headline-md text-headline-md ${estilos.texto}`}>$</span>
              <input
                type="text"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(normalizarMonto(e.target.value))}
                placeholder="0,00"
                aria-label="Monto"
                className={`w-full max-w-[200px] border-none bg-transparent p-0 text-center font-display-currency text-display-currency outline-none ${estilos.texto}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest p-5 shadow-soft">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="descripcion"
                className="font-label-caps text-label-caps uppercase text-on-surface-variant"
              >
                Descripción
              </label>
              <input
                id="descripcion"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={tipo === "Egreso" ? "¿En qué gastaste?" : "¿De dónde vino?"}
                maxLength={200}
                className="w-full rounded-xl border-none bg-surface-container px-4 py-3.5 font-body-md text-body-md text-on-background transition-shadow outline-none placeholder:text-outline focus:ring-1 focus:ring-primary-container"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Categoría
              </span>

              {categoriasDelTipo.length === 0 && !listaCategorias.cargando ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No tenés categorías de {tipo.toLowerCase()}.{" "}
                  <Link to="/categorias" className="text-primary underline">
                    Crear una
                  </Link>
                </p>
              ) : (
                /*
                  Tres columnas y no cuatro, en cualquier pantalla: el formulario
                  vive siempre en una columna de 390px, asi que en la computadora
                  no sobra un pixel respecto del celular y una cuarta columna solo
                  achica las celdas. Medido a 375px, que es el celular tipico: con
                  cuatro columnas quedaban 53px para el texto y "Supermercado" mide
                  86px, asi que la palabra empujaba la celda y se salia del
                  recuadro. Con tres quedan 83px y el nombre entra, partido en dos
                  renglones cuando hace falta.
                */
                <div className="grid grid-cols-3 gap-2">
                  {categoriasDelTipo.map((categoria) => {
                    const elegida = categoria.id === categoriaId;
                    return (
                      <button
                        key={categoria.id}
                        type="button"
                        onClick={() => setCategoriaId(categoria.id)}
                        aria-pressed={elegida}
                        className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-3 transition-transform active:scale-95 ${
                          elegida
                            ? estilos.chipActivo
                            : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <Icono nombre={iconoDe(categoria)} relleno={elegida} />
                        {/*
                          El nombre lo pone el usuario y puede ser cualquiera, asi que
                          ninguna medida alcanza para que siempre entre en un renglon.
                          Sin esto una palabra larga empuja la celda y se sale del
                          recuadro: hyphens-auto la corta con guion donde corresponde en
                          castellano (por eso el index.html lleva lang="es") y
                          break-words es la red de seguridad para cuando el navegador no
                          tiene el diccionario.
                        */}
                        <span className="w-full text-center font-label-sm text-[12px] leading-tight hyphens-auto break-words">
                          {categoria.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="cuenta"
                className="font-label-caps text-label-caps uppercase text-on-surface-variant"
              >
                Cuenta
              </label>

              {listaCuentas.datos?.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  No tenés ninguna cuenta.{" "}
                  <Link to="/cuentas" className="text-primary underline">
                    Crear una
                  </Link>
                </p>
              ) : (
                <div className="relative">
                  <select
                    id="cuenta"
                    value={cuentaElegida}
                    onChange={(e) => setCuentaId(e.target.value)}
                    className="w-full appearance-none rounded-xl border-none bg-surface-container px-4 py-3.5 pr-10 font-body-md text-body-md text-on-background transition-shadow outline-none focus:ring-1 focus:ring-primary-container"
                  >
                    {listaCuentas.datos?.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {cuenta.nombre}
                      </option>
                    ))}
                  </select>
                  <Icono
                    nombre="expand_more"
                    className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-on-surface-variant"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="fecha"
                className="font-label-caps text-label-caps uppercase text-on-surface-variant"
              >
                Fecha
              </label>
              <div className="relative flex items-center rounded-xl bg-surface-container px-4 py-3.5 transition-shadow focus-within:ring-1 focus-within:ring-primary-container">
                <Icono nombre="calendar_month" className="mr-3 text-on-surface-variant" />
                <input
                  id="fecha"
                  type="date"
                  value={fecha}
                  max={hoyIso()}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border-none bg-transparent p-0 font-body-md text-body-md text-on-background outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-error-container p-3 font-body-md text-body-md text-on-error-container">
              {error}
            </p>
          )}
        </div>

        {/* Boton principal, siempre visible sobre el degradado del fondo. */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent p-container-margin pt-8">
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="w-full rounded-xl bg-primary-container py-4 font-headline-md text-headline-md text-on-primary shadow-floating transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            {guardando ? "Guardando…" : "Guardar movimiento"}
          </button>
        </div>
      </form>
    </div>
  );
}
