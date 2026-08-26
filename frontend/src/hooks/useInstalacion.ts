import { useEffect, useState } from "react";

// Evento propio de Chrome, todavia no esta en el estandar ni en las tipificaciones
// del DOM. El navegador lo dispara cuando la app cumple los requisitos para
// instalarse (manifiesto + service worker + HTTPS o localhost).
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type EstadoInstalacion =
  // Ya se abre como app: no hay nada que ofrecer.
  | "instalada"
  // Chrome nos dejo el evento guardado: hay boton de instalar de verdad.
  | "disponible"
  // Safari en iPhone y iPad no tiene el evento: solo queda explicar los pasos.
  | "manual"
  // Todavia no llego el evento, o el navegador no instala apps.
  | "esperando";

function abiertaComoApp() {
  // El primero lo cumplen Chrome y Edge; el segundo es la marca vieja de Safari
  // en iOS, que sigue siendo la unica forma de saberlo ahi.
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Ofrece instalar Qwak como app. Devuelve en que situacion esta el navegador y,
// si se puede, la funcion que abre el dialogo del sistema.
export function useInstalacion() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);
  const [instalada, setInstalada] = useState(abiertaComoApp);

  useEffect(() => {
    // Sin `preventDefault` Chrome muestra su propio cartelito y no nos deja
    // elegir el momento; con el, el evento queda guardado para el boton.
    function alPoderInstalar(e: Event) {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
    }
    function alInstalar() {
      setInstalada(true);
      setEvento(null);
    }

    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  const estado: EstadoInstalacion = instalada
    ? "instalada"
    : evento !== null
      ? "disponible"
      : esIOS()
        ? "manual"
        : "esperando";

  async function instalar() {
    if (evento === null) return;
    await evento.prompt();
    // El evento se consume: Chrome no lo deja usar dos veces. Si el usuario
    // dijo que no, vuelve a dispararse solo mas adelante.
    await evento.userChoice;
    setEvento(null);
  }

  return { estado, instalar };
}
