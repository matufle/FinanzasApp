import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSesion } from "../auth/contexto";
import { useInstalacion } from "../hooks/useInstalacion";
import { useNotificaciones } from "../hooks/useNotificaciones";
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
          <Instalacion />
          <Separador />
          <Recordatorio />
          <Separador />
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

// Fila para instalar Qwak como app. Que ofrece depende del navegador: Chrome
// deja abrir su propio dialogo, Safari en iPhone no y hay que explicar los dos
// toques a mano.
function Instalacion() {
  const { estado, instalar } = useInstalacion();
  const [pasosAbiertos, setPasosAbiertos] = useState(false);

  if (estado === "instalada") {
    return (
      <div className="flex w-full items-center gap-4 p-4">
        <Icono nombre="check_circle" className="text-secondary" />
        <span className="font-body-lg text-body-lg text-on-surface-variant">
          La app ya está instalada
        </span>
      </div>
    );
  }

  if (estado === "disponible") {
    return (
      <Fila icono="install_desktop" texto="Instalar la app" onClick={() => void instalar()} />
    );
  }

  return (
    <>
      <Fila
        icono="install_desktop"
        texto="Instalar la app"
        expandido={pasosAbiertos}
        onClick={() => setPasosAbiertos((abierto) => !abierto)}
      />
      {pasosAbiertos && (
        <div className="border-t border-surface-container-low px-4 py-4 font-body-md text-body-md text-on-surface-variant">
          {estado === "manual" ? (
            <p>
              En iPhone y iPad se instala desde Safari: tocá el botón de
              compartir y elegí <strong>Agregar a inicio</strong>.
            </p>
          ) : (
            <p>
              Este navegador todavía no ofrece instalarla. En Chrome o Edge
              aparece un ícono en la barra de direcciones, o está en el menú de
              tres puntos como <strong>Instalar Qwak</strong>.
            </p>
          )}
        </div>
      )}
    </>
  );
}

// Recordatorio diario: si a la noche todavia no cargaste nada, el servidor
// manda un aviso al celular o a la compu. La suscripcion es de este navegador,
// no de la cuenta, asi que el interruptor se prende en cada dispositivo.
function Recordatorio() {
  const { estado, cargando, trabajando, mensaje, encender, apagar, probar } = useNotificaciones();

  const encendido = estado === "encendido";
  const sePuede = estado === "encendido" || estado === "apagado";

  const explicacion = {
    "sin-soporte": "Este navegador no puede recibir avisos.",
    "sin-configurar": "El servidor todavía no tiene configuradas las notificaciones.",
    bloqueado:
      "Bloqueaste los avisos para este sitio. Se vuelven a permitir desde el candado de la barra de direcciones.",
    apagado: "Si a la noche no cargaste ningún movimiento, te avisa.",
    encendido: "Si a la noche no cargaste ningún movimiento, te avisa.",
  }[estado];

  return (
    <>
      <div className="flex w-full items-center justify-between gap-4 p-4">
        <div className="flex min-w-0 items-center gap-4">
          <Icono
            nombre="notifications"
            className={encendido ? "text-primary-container" : "text-outline"}
          />
          <div className="min-w-0">
            <p className="font-body-lg text-body-lg text-on-background">Recordatorio diario</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{explicacion}</p>
          </div>
        </div>

        <Interruptor
          activo={encendido}
          deshabilitado={!sePuede || cargando || trabajando}
          etiqueta="Recordatorio diario"
          onClick={() => void (encendido ? apagar() : encender())}
        />
      </div>

      {(encendido || mensaje !== null) && (
        <div className="flex items-center justify-between gap-4 border-t border-surface-container-low px-4 py-3">
          <p className="font-body-md text-body-md text-on-surface-variant">
            {mensaje ?? "¿Querés ver cómo llega?"}
          </p>
          {encendido && (
            <button
              type="button"
              onClick={() => void probar()}
              disabled={trabajando}
              className="shrink-0 rounded-full px-3 py-1 font-label-sm text-label-sm font-bold text-primary-container transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              Probar
            </button>
          )}
        </div>
      )}
    </>
  );
}

// Interruptor al estilo Material: la pastilla se pinta y el circulo se corre.
function Interruptor({
  activo,
  deshabilitado,
  etiqueta,
  onClick,
}: {
  activo: boolean;
  deshabilitado: boolean;
  etiqueta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={onClick}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 ${
        activo ? "bg-primary-container" : "bg-surface-container-highest"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-surface-container-lowest shadow-soft transition-all duration-200 ${
          activo ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

// El nombre, el email y la foto salen del login con Google y quedan guardados
// con la sesion. Si por algo faltan, se muestra un marcador en vez de un hueco.
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
