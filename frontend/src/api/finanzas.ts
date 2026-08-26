import { api } from "./cliente";
import type { RespuestaSesion, Usuario } from "./token";
import type {
  Categoria,
  CrearCategoriaRequest,
  CrearCuentaRequest,
  CrearMovimientoRequest,
  Cuenta,
  Metricas,
  Movimiento,
  ConfiguracionPush,
  Resumen,
  ResultadoEnvio,
  SuscripcionPushRequest,
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

  // El mes va como numero 1-12, no como el 0-11 de Date: hay que sumarle uno.
  metricas: (anio: number, mes: number, cuentaId?: string, meses = 6) =>
    api.get<Metricas>(
      conParametros("/api/reportes/metricas", {
        anio: String(anio),
        mes: String(mes),
        cuentaId,
        meses: String(meses),
      }),
    ),
};

export const notificaciones = {
  // El navegador necesita la clave publica del servidor para poder suscribirse.
  // Si `habilitado` viene en false es que la Api no tiene claves cargadas.
  configuracion: () =>
    api.get<ConfiguracionPush>("/api/notificaciones/clave-publica"),

  suscribir: (datos: SuscripcionPushRequest) =>
    api.post<void>("/api/notificaciones/suscripciones", datos),

  darDeBaja: (endpoint: string) =>
    api.post<void>("/api/notificaciones/suscripciones/baja", { endpoint }),

  // El endpoint del navegador es una URL larga, asi que va como parametro
  // codificado y no pegado a la ruta.
  estado: (endpoint: string) =>
    api.get<{ suscripto: boolean }>(
      conParametros("/api/notificaciones/suscripciones/estado", { endpoint }),
    ),

  probar: () => api.post<ResultadoEnvio>("/api/notificaciones/prueba", {}),
};

export const autenticacion = {
  // Canjea el ID token que devuelve Google por el token propio de Qwak.
  conGoogle: (credencial: string) =>
    api.post<RespuestaSesion>("/api/auth/google", { credencial }),

  // Solo existe cuando la Api corre en Development. Sirve para trabajar en el
  // frontend sin tener que pasar por Google en cada recarga.
  desarrollo: () => api.post<RespuestaSesion>("/api/auth/desarrollo", {}),

  yo: () => api.get<Usuario>("/api/auth/yo"),
};
