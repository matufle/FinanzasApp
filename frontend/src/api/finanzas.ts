import { api } from "./cliente";
import type {
  Categoria,
  CrearCategoriaRequest,
  CrearCuentaRequest,
  CrearMovimientoRequest,
  Cuenta,
  Movimiento,
  Resumen,
  TipoMovimiento,
} from "./tipos";

// Una funcion por endpoint. Las pantallas llaman a estas y no a fetch,
// asi la URL de cada ruta vive en un solo lugar.

function conParametros(ruta: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor) query.append(clave, valor);
  }
  const texto = query.toString();
  return texto ? `${ruta}?${texto}` : ruta;
}

export const cuentas = {
  listar: () => api.get<Cuenta[]>("/api/cuentas"),
  obtener: (id: string) => api.get<Cuenta>(`/api/cuentas/${id}`),
  crear: (datos: CrearCuentaRequest) => api.post<Cuenta>("/api/cuentas", datos),
  darDeBaja: (id: string) => api.delete(`/api/cuentas/${id}`),
};

export const categorias = {
  listar: (tipo?: TipoMovimiento) =>
    api.get<Categoria[]>(conParametros("/api/categorias", { tipo })),
  crear: (datos: CrearCategoriaRequest) =>
    api.post<Categoria>("/api/categorias", datos),
  darDeBaja: (id: string) => api.delete(`/api/categorias/${id}`),
};

export const movimientos = {
  listar: (desde?: string, hasta?: string, cuentaId?: string) =>
    api.get<Movimiento[]>(conParametros("/api/movimientos", { desde, hasta, cuentaId })),
  crear: (datos: CrearMovimientoRequest) =>
    api.post<Movimiento>("/api/movimientos", datos),
  anular: (id: string) => api.delete(`/api/movimientos/${id}`),
};

export const reportes = {
  resumen: (desde?: string, hasta?: string, cuentaId?: string) =>
    api.get<Resumen>(conParametros("/api/reportes/resumen", { desde, hasta, cuentaId })),
};
