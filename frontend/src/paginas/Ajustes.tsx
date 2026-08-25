import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSesion } from "../auth/contexto";
import { Icono } from "../componentes/Icono";
import { BarraSuperior, Pantalla } from "../componentes/Pantalla";

const VERSION = "1.0.0";

export function Ajustes() {
  const navegar = useNavigate();
  const { cerrarSesion } = useSesion();
  const [acercaDeAbierto, setAcercaDeAbierto] = useState(false);

  function salir() {
    cerrarSesion();
    navegar("/login", { replace: true });
  }

  return (
    <Pantalla
      activo="ajustes"
      encabezado={
        <BarraSuperior
          centro={<h1 className="font-headline-md text-headline-md text-primary">Ajustes</h1>}
        />
      }
    >
      <div className="space-y-stack-gap-lg px-container-margin py-stack-gap-lg">
        <TarjetaPerfil />

        <Grupo titulo="MI DINERO">
          <Fila
            icono="account_balance_wallet"
            texto="Cuentas"
            onClick={() => navegar("/cuentas")}
          />
          <Separador />
          <Fila icono="sell" texto="Categorías" onClick={() => navegar("/categorias")} />
        </Grupo>

        <Grupo titulo="LA APP">
          <Fila
            icono="info"
            texto="Acerca de"
            expandido={acercaDeAbierto}
            onClick={() => setAcercaDeAbierto((abierto) => !abierto)}
          />
          {acercaDeAbierto && (
            <div className="border-t border-surface-container-low px-4 py-4 font-body-md text-body-md text-on-surface-variant">
              <p className="mb-2">
                Qwak es una app de finanzas personales hecha a medida: registrás
                ingresos y egresos, los clasificás por categoría y ves el balance de cada mes.
              </p>
              <p>Los datos viven en tu propia base y no se comparten con nadie.</p>
            </div>
          )}
        </Grupo>

        <div className="pt-4">
          <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-soft">
            <button
              type="button"
              onClick={salir}
              className="flex w-full items-center gap-4 p-4 text-error transition-colors duration-200 hover:bg-error-container/20 active:scale-[0.99] active:bg-error-container/40"
            >
              <Icono nombre="logout" />
              <span className="font-body-lg text-body-lg font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>

        <div className="pt-8 pb-4 text-center">
          <p className="font-label-sm text-label-sm text-outline-variant">Versión {VERSION}</p>
        </div>
      </div>
    </Pantalla>
  );
}

// Mientras no exista el login con Google no hay nombre ni foto que mostrar,
// asi que la tarjeta explica de donde van a salir en vez de inventar datos.
function TarjetaPerfil() {
  const { usuario } = useSesion();

  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-soft">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container">
        {usuario?.foto ? (
          <img src={usuario.foto} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icono nombre="person" className="text-[32px]! text-on-surface-variant" />
        )}
      </div>
      <div className="flex flex-col justify-center">
        <h2 className="font-headline-md text-[20px] leading-[26px] text-primary">
          {usuario?.nombre ?? "Tu cuenta"}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {usuario?.email ?? "Se completa al conectar Google"}
        </p>
      </div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-stack-gap-sm">
      <h3 className="ml-2 font-label-caps text-label-caps tracking-wider text-on-surface-variant">
        {titulo}
      </h3>
      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-soft">
        {children}
      </div>
    </section>
  );
}

function Fila({
  icono,
  texto,
  onClick,
  expandido,
}: {
  icono: string;
  texto: string;
  onClick: () => void;
  // Cuando la fila despliega contenido en vez de navegar, la flecha gira.
  expandido?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expandido}
      className="flex w-full items-center justify-between p-4 transition-colors duration-200 hover:bg-surface-container-low active:scale-[0.99] active:bg-surface-container"
    >
      <div className="flex items-center gap-4">
        <Icono nombre={icono} className="text-primary-container" />
        <span className="font-body-lg text-body-lg text-on-background">{texto}</span>
      </div>
      <Icono
        nombre="chevron_right"
        className={`text-outline-variant transition-transform ${expandido ? "rotate-90" : ""}`}
      />
    </button>
  );
}

function Separador() {
  return <div className="ml-auto h-px w-[calc(100%-1rem)] bg-surface-container-low" />;
}
