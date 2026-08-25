import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { EVENTO_SESION_EXPIRADA } from "../api/cliente";
import { borrarSesion, guardarSesion, leerToken, leerUsuario } from "../api/token";
import type { Usuario } from "../api/token";
import { ContextoSesion, useSesion } from "./contexto";
import type { Sesion } from "./contexto";
import { olvidarCuenta } from "./google";

// Mantiene la sesion en memoria (para que React vuelva a dibujar al entrar o
// salir) y en localStorage (para que recargar la pagina no te eche).
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => leerToken());
  const [usuario, setUsuario] = useState<Usuario | null>(() => leerUsuario());

  const iniciarSesion = useCallback((nuevo: string, datos: Usuario | null = null) => {
    guardarSesion(nuevo, datos);
    setToken(nuevo);
    setUsuario(datos);
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    // Sin esto Google vuelve a entrar solo con la misma cuenta y "cerrar
    // sesion" no se siente como cerrar sesion.
    olvidarCuenta();
    setToken(null);
    setUsuario(null);
  }, []);

  // El token dura 30 dias, asi que tarde o temprano vence estando la app
  // abierta. Cuando la Api contesta 401, el cliente HTTP avisa por este evento
  // y aca se limpia el estado; RutaProtegida hace el resto.
  useEffect(() => {
    function alExpirar() {
      setToken(null);
      setUsuario(null);
    }

    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const valor = useMemo<Sesion>(
    () => ({ token, usuario, autenticado: token !== null, iniciarSesion, cerrarSesion }),
    [token, usuario, iniciarSesion, cerrarSesion],
  );

  return <ContextoSesion value={valor}>{children}</ContextoSesion>;
}

// Envuelve las pantallas que exigen estar logueado: si no hay token,
// manda al login y recuerda a donde queria entrar el usuario.
export function RutaProtegida({ children }: { children: ReactNode }) {
  const { autenticado } = useSesion();
  const ubicacion = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />;
  }

  return children;
}
