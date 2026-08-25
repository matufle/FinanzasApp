import { useCallback, useEffect, useState } from "react";

interface EstadoPeticion<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

// Evita repetir en cada pantalla el mismo trio de useState
// (datos / cargando / error) y el try-catch alrededor del fetch.
export function usePeticion<T>(
  pedir: () => Promise<T>,
  dependencias: unknown[] = [],
): EstadoPeticion<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(pedir, dependencias);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await ejecutar());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, [ejecutar]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { datos, cargando, error, recargar: () => void cargar() };
}
