import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { categorias, reportes } from "../api/finanzas";
import type { Categoria, TipoMovimiento } from "../api/tipos";
import { usePeticion } from "../hooks/usePeticion";
import { Icono } from "../componentes/Icono";
import { BarraSuperior, BotonIcono, Pantalla } from "../componentes/Pantalla";
import { ModalNuevaCategoria, SelectorTipo } from "../componentes/ModalNuevaCategoria";
import { coloresDe, iconoDe } from "../componentes/iconosCategoria";

// El resumen se pide por rango de fechas. Este rango cubre todo lo que puede
// llegar a existir, asi el contador de cada tarjeta es historico y no del mes.
const DESDE_SIEMPRE = "2000-01-01";
const HASTA_SIEMPRE = "2100-01-01";

export function Categorias() {
  const navegar = useNavigate();
  const [tipo, setTipo] = useState<TipoMovimiento>("Egreso");
  const [modalAbierto, setModalAbierto] = useState(false);

  // Se piden todas de una y el filtro por pestaña se hace en memoria:
  // cambiar de Egresos a Ingresos no vuelve a golpear la API.
  const lista = usePeticion(() => categorias.listar(), []);
  const resumen = usePeticion(() => reportes.resumen(DESDE_SIEMPRE, HASTA_SIEMPRE), []);

  const movimientosPorCategoria = new Map(
    resumen.datos?.porCategoria.map((r) => [r.categoriaId, r.cantidadMovimientos]) ?? [],
  );

  const visibles = (lista.datos ?? []).filter((c) => c.tipo === tipo);

  function alCrear(creada: Categoria) {
    setModalAbierto(false);
    setTipo(creada.tipo);
    lista.recargar();
  }

  return (
    <Pantalla
      activo="ajustes"
      encabezado={
        <BarraSuperior
          izquierda={
            <BotonIcono onClick={() => navegar(-1)} etiqueta="Volver">
              <Icono nombre="arrow_back" />
            </BotonIcono>
          }
          centro={<h1 className="font-headline-md text-headline-md text-primary">Categorías</h1>}
        />
      }
    >
      <div className="px-container-margin py-stack-gap-lg">
        <div className="mb-stack-gap-lg">
          <SelectorTipo valor={tipo} alCambiar={setTipo} plural />
        </div>

        {lista.cargando && (
          <p className="py-8 text-center font-body-md text-body-md text-on-surface-variant">
            Cargando categorías…
          </p>
        )}

        {lista.error && (
          <div className="rounded-xl bg-error-container p-4 font-body-md text-body-md text-on-error-container">
            <p>{lista.error}</p>
            <button type="button" onClick={lista.recargar} className="mt-2 underline">
              Reintentar
            </button>
          </div>
        )}

        {!lista.cargando && !lista.error && (
          <div className="grid grid-cols-2 gap-inline-gutter sm:grid-cols-3 md:grid-cols-4">
            {visibles.map((categoria) => (
              <TarjetaCategoria
                key={categoria.id}
                categoria={categoria}
                movimientos={movimientosPorCategoria.get(categoria.id) ?? 0}
              />
            ))}

            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant p-4 text-center transition-colors hover:bg-surface-container-low"
            >
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full text-outline">
                <Icono nombre="add" className="text-4xl!" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface-variant">Nueva</h3>
            </button>
          </div>
        )}

        {!lista.cargando && !lista.error && visibles.length === 0 && (
          <p className="mt-stack-gap-lg text-center font-body-md text-body-md text-on-surface-variant">
            Todavía no hay categorías de {tipo.toLowerCase()}.
          </p>
        )}
      </div>

      {modalAbierto && (
        <ModalNuevaCategoria
          tipoInicial={tipo}
          alCerrar={() => setModalAbierto(false)}
          alCrear={alCrear}
        />
      )}
    </Pantalla>
  );
}

function TarjetaCategoria({
  categoria,
  movimientos,
}: {
  categoria: Categoria;
  movimientos: number;
}) {
  const colores = coloresDe(categoria);

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-lowest p-4 text-center shadow-soft transition-shadow hover:shadow-floating">
      <div
        className={`mb-2 flex h-16 w-16 items-center justify-center rounded-full ${colores.fondo} ${colores.texto}`}
      >
        <Icono nombre={iconoDe(categoria)} relleno />
      </div>
      <h3 className="font-headline-md text-headline-md text-primary">{categoria.nombre}</h3>
      <p className="font-label-sm text-label-sm text-outline">
        {movimientos === 1 ? "1 movimiento" : `${movimientos} movimientos`}
      </p>
    </div>
  );
}
