import { createContext, useContext } from "react";
import type { Usuario } from "../api/token";

export interface Sesion {
  token: string | null;
  usuario: Usuario | null;
  autenticado: boolean;
  iniciarSesion: (token: string, usuario?: Usuario | null) => void;
  cerrarSesion: () => void;
}

export const ContextoSesion = createContext<Sesion | null>(null);

// Cualquier pantalla puede preguntar por la sesion con este hook,
// sin recibirla por props desde arriba.
export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion);
  if (sesion === null) {
    throw new Error("useSesion se uso fuera de <ProveedorSesion>");
  }
  return sesion;
}
