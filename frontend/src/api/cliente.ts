import { borrarSesion, leerToken } from "./token";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5199";

// Cuando la Api contesta 401, el token guardado ya no sirve. El cliente HTTP no
// puede navegar por si mismo (no conoce el router), asi que avisa por un evento
// y el contexto de sesion se encarga de limpiar el estado y rebotar al login.
export const EVENTO_SESION_EXPIRADA = "qwak:sesion-expirada";

// Error con el mensaje que manda la API, para poder mostrarlo en pantalla
// en vez de un "algo salio mal" generico.
export class ErrorApi extends Error {
  readonly codigo: number;

  constructor(codigo: number, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
    this.codigo = codigo;
  }
}

interface RespuestaError {
  titulo?: string;
  detalle?: string;
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = leerToken();

  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      // La Api exige sesion en todo /api salvo el login: el token viaja siempre.
      ...(token !== null ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });

  if (!respuesta.ok) {
    let mensaje = `Error ${respuesta.status}`;
    try {
      const cuerpo: RespuestaError = await respuesta.json();
      mensaje = cuerpo.detalle ?? cuerpo.titulo ?? mensaje;
    } catch {
      // La respuesta no traia JSON; nos quedamos con el mensaje generico.
    }

    // Los propios endpoints de login contestan 401 cuando la cuenta no tiene
    // acceso: ahi el 401 es la respuesta esperada, no una sesion vencida.
    if (respuesta.status === 401 && !ruta.startsWith("/api/auth/")) {
      borrarSesion();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }

    throw new ErrorApi(respuesta.status, mensaje);
  }

  // Los DELETE devuelven 204 sin cuerpo, y .json() reventaria.
  if (respuesta.status === 204) {
    return undefined as T;
  }

  return respuesta.json() as Promise<T>;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>(ruta),

  post: <T>(ruta: string, cuerpo: unknown) =>
    pedir<T>(ruta, { method: "POST", body: JSON.stringify(cuerpo) }),

  delete: (ruta: string) => pedir<void>(ruta, { method: "DELETE" }),
};
