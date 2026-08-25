// Unico lugar donde se guarda la sesion.
// Lo leen dos partes que no deberian conocerse entre si: el cliente HTTP
// (para mandar el header Authorization) y el contexto de sesion de React.
const CLAVE_TOKEN = "finanzasapp.token";
const CLAVE_USUARIO = "finanzasapp.usuario";

// Quien entro. Lo arma la Api a partir del ID token de Google y viaja
// junto con el token de sesion.
export interface Usuario {
  nombre: string;
  email: string;
  foto: string | null;
}

export function leerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function leerUsuario(): Usuario | null {
  const guardado = localStorage.getItem(CLAVE_USUARIO);
  if (guardado === null) return null;

  try {
    return JSON.parse(guardado) as Usuario;
  } catch {
    // Dato corrupto de una version anterior: se ignora en vez de romper la app.
    return null;
  }
}

export function guardarSesion(token: string, usuario: Usuario | null): void {
  localStorage.setItem(CLAVE_TOKEN, token);
  if (usuario === null) localStorage.removeItem(CLAVE_USUARIO);
  else localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function borrarSesion(): void {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

// Lo que devuelve POST /api/auth/google: el token propio de Qwak, cuando vence
// y quien entro.
export interface RespuestaSesion {
  token: string;
  expira: string;
  usuario: Usuario;
}
