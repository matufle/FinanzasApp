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
