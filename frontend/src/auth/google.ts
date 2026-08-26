// Envoltorio de "Google Identity Services", la libreria que dibuja el boton de
// "Continuar con Google" y devuelve un ID token firmado por Google.
//
// La libreria no viene por npm: es un script que hay que bajar de Google en
// caliente. Se carga aca, una sola vez, y solo cuando alguien abre el login;
// el resto de la app no paga ese pedido.

// El Client ID no es secreto: identifica a la app ante Google y viaja al
// navegador de todas formas. Lo que si es secreto es el Client Secret, que
// este flujo no necesita.
export const CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export const GOOGLE_CONFIGURADO = CLIENT_ID.trim() !== "";

interface RespuestaCredencial {
  // El ID token. Es lo unico que le importa a la Api.
  credential: string;
}

interface OpcionesBoton {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface IdentidadGoogle {
  initialize(config: {
    client_id: string;
    callback: (respuesta: RespuestaCredencial) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(padre: HTMLElement, opciones: OpcionesBoton): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: IdentidadGoogle } };
  }
}

const URL_LIBRERIA = "https://accounts.google.com/gsi/client";

// Una sola promesa compartida: si dos componentes piden la libreria al mismo
// tiempo, el script se agrega una vez sola y los dos esperan el mismo resultado.
let carga: Promise<IdentidadGoogle> | null = null;

export function cargarGoogle(): Promise<IdentidadGoogle> {
  if (carga !== null) return carga;

  carga = new Promise<IdentidadGoogle>((resolver, rechazar) => {
    const yaEsta = window.google?.accounts?.id;
    if (yaEsta !== undefined) {
      resolver(yaEsta);
      return;
    }

    const etiqueta = document.createElement("script");
    etiqueta.src = URL_LIBRERIA;
    etiqueta.async = true;
    etiqueta.defer = true;

    etiqueta.onload = () => {
      const identidad = window.google?.accounts?.id;
      if (identidad === undefined) {
        rechazar(new Error("El login de Google cargo pero no quedo disponible."));
        return;
      }
      resolver(identidad);
    };

    // Tipico cuando no hay internet o una extension bloquea el dominio de Google.
    etiqueta.onerror = () => {
      carga = null;
      rechazar(new Error("No se pudo cargar el login de Google."));
    };

    document.head.appendChild(etiqueta);
  });

  return carga;
}

// Al cerrar sesion hay que decirle a Google que no vuelva a entrar solo,
// porque si no el proximo login lo hace sin preguntar y no se puede cambiar
// de cuenta.
export function olvidarCuenta(): void {
  window.google?.accounts?.id?.disableAutoSelect();
}

// Que el boton de Google no abra nada es el peor final posible: la libreria se
// come el error, deja una linea en la consola y la pantalla no dice nada. Para
// quien mira, eso es indistinguible de una app rota.
//
// La API de Google no avisa de esto —error_callback no se dispara—, pero los dos
// caminos que puede tomar el boton dejan una senal propia, y las dos se pueden
// escuchar sin tocar la libreria:
//
//   FedCM     el navegador dibuja el dialogo y Google pide la credencial por
//             navigator.credentials.get(); si falla, esa promesa rechaza.
//   Popup     Google abre una ventana con window.open(), que devuelve null
//             cuando el navegador la bloqueo.
//
// Se envuelven las dos mientras el boton esta en pantalla y se restauran al
// salir. Devuelve la funcion de limpieza.
export function avisarSiElLoginNoAbre(alFallar: (mensaje: string) => void): () => void {
  const restauraciones = [vigilarFedcm(alFallar), vigilarPopup(alFallar)];
  return () => restauraciones.forEach((restaurar) => restaurar());
}

const MENSAJE_FEDCM =
  "El navegador no pudo completar el inicio de sesión con Google. Suele pasar si no tenés " +
  "una sesión de Google abierta o si el navegador tiene bloqueado el inicio de sesión de terceros.";

const MENSAJE_POPUP =
  "Tu navegador bloqueó la ventana de Google. Permití las ventanas emergentes para este sitio " +
  "y volvé a intentar.";

// Cerrar el dialogo a proposito rechaza igual que un fallo de verdad. No es un
// error: es alguien que se arrepintio, y merece silencio.
function loCancelaronAdrede(motivo: unknown): boolean {
  return (
    motivo instanceof DOMException && (motivo.name === "AbortError" || motivo.name === "NotAllowedError")
  );
}

function vigilarFedcm(alFallar: (mensaje: string) => void): () => void {
  // Navegadores viejos no tienen la API; ahi el boton usa el popup y listo.
  if (typeof navigator.credentials?.get !== "function") return () => {};

  const original = navigator.credentials.get;

  const envoltorio = function (this: CredentialsContainer, opciones?: CredentialRequestOptions) {
    const pedido = original.call(this, opciones);

    // Apenas se dibuja el boton, la libreria hace un intento de FedCM por su
    // cuenta, sin que nadie toque nada, y ese intento falla de mil formas
    // inocentes. Avisar de eso seria plantar un cartel de error en una pantalla
    // recien abierta. Lo que distingue al intento de verdad es el gesto de
    // quien entra: el navegador marca la activacion como activa unicamente
    // durante el clic. Se lee ahora y no dentro del catch, porque para cuando
    // la promesa rechaza esa activacion ya expiro.
    const loPidioAlguien = navigator.userActivation?.isActive === true;

    // Y solo interesa FedCM: cualquier otro uso de la API —una passkey, por
    // ejemplo— pasa de largo sin que lo toquemos.
    if (loPidioAlguien && opciones !== undefined && "identity" in opciones) {
      pedido.catch((motivo: unknown) => {
        if (!loCancelaronAdrede(motivo)) alFallar(MENSAJE_FEDCM);
      });
    }

    // Se devuelve la promesa original, no la del catch: Google tiene que ver el
    // rechazo tal cual para poder volver al popup si corresponde.
    return pedido;
  } as typeof navigator.credentials.get;

  navigator.credentials.get = envoltorio;

  return () => {
    if (navigator.credentials.get === envoltorio) navigator.credentials.get = original;
  };
}

function vigilarPopup(alFallar: (mensaje: string) => void): () => void {
  const original = window.open;

  const envoltorio = ((...argumentos: Parameters<typeof window.open>) => {
    const ventana = original.apply(window, argumentos);
    if (ventana === null || ventana === undefined) alFallar(MENSAJE_POPUP);
    return ventana;
  }) as typeof window.open;

  window.open = envoltorio;

  return () => {
    // Si algo mas piso window.open en el medio, restaurar seria pisarlo a el.
    if (window.open === envoltorio) window.open = original;
  };
}
