// Espejo en TypeScript de los DTOs de la API (FinanzasApp.Application/Dtos).
// Si cambia un DTO del backend, hay que actualizar estos tipos.

export type TipoMovimiento = "Ingreso" | "Egreso";
export type EstadoRegistro = "Activo" | "Inactivo";

export interface Cuenta {
  id: string;
  nombre: string;
  saldoInicial: number;
  saldoActual: number;
  estado: EstadoRegistro;
}

export interface CrearCuentaRequest {
  nombre: string;
  saldoInicial: number;
}

export interface Categoria {
  id: string;
  nombre: string;
  tipo: TipoMovimiento;
  // Nombre de un icono de Material Symbols. null en las categorias
  // creadas antes de que existiera el campo.
  icono: string | null;
  estado: EstadoRegistro;
}

export interface CrearCategoriaRequest {
  nombre: string;
  tipo: TipoMovimiento;
  icono?: string;
}

export interface Movimiento {
  id: string;
  monto: number;
  tipo: TipoMovimiento;
  fecha: string;
  descripcion: string;
  cuentaId: string;
  cuentaNombre: string;
  categoriaId: string;
  categoriaNombre: string;
}

export interface CrearMovimientoRequest {
  monto: number;
  tipo: TipoMovimiento;
  fecha: string;
  descripcion: string;
  cuentaId: string;
  categoriaId: string;
}

export interface ResumenCategoria {
  categoriaId: string;
  categoriaNombre: string;
  tipo: TipoMovimiento;
  total: number;
  cantidadMovimientos: number;
}

export interface Resumen {
  desde: string;
  hasta: string;
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  porCategoria: ResumenCategoria[];
}

// --- Metricas (GET /api/reportes/metricas) ---

export interface Periodo {
  anio: number;
  mes: number;
  // "ago 2026", ya armada por el backend.
  etiqueta: string;
  ingresos: number;
  egresos: number;
  balance: number;
}

export interface Comparativa {
  diferenciaIngresos: number;
  // Proporcion, no porcentaje: 0.15 es "15% mas". null cuando el mes anterior
  // fue cero y no hay porcentaje posible; ahi se muestra la diferencia en plata.
  variacionIngresos: number | null;
  diferenciaEgresos: number;
  variacionEgresos: number | null;
  diferenciaBalance: number;
}

export interface Proyeccion {
  diasTranscurridos: number;
  diasDelMes: number;
  promedioDiarioEgresos: number;
  egresosProyectados: number;
  balanceProyectado: number;
  disponiblePorDia: number;
}

export interface Metricas {
  actual: Periodo;
  anterior: Periodo;
  comparativa: Comparativa;
  // Proporcion de lo que entro que no se gasto (0.25 = 25%). null si no hubo
  // ingresos en el mes: la tasa no significa nada y mostrar 0% enganaria.
  tasaDeAhorro: number | null;
  proyeccion: Proyeccion;
  // Del mes mas viejo al mas nuevo, para pintar el grafico de izquierda a derecha.
  flujoDeCaja: Periodo[];
  topEgresos: ResumenCategoria[];
}

// --- Notificaciones ---

export interface ConfiguracionPush {
  // false cuando el servidor no tiene cargadas las claves VAPID: sin eso no se
  // puede ni ofrecer activarlas.
  habilitado: boolean;
  clavePublica: string;
}

export interface SuscripcionPushRequest {
  endpoint: string;
  claveP256dh: string;
  claveAuth: string;
  dispositivo: string;
}

export interface ResultadoEnvio {
  // true cuando no hacia falta avisar: ya se habia cargado algo, o no hay
  // ningun dispositivo suscripto.
  salteado: boolean;
  motivo: string;
  enviadas: number;
  vencidas: number;
  fallidas: number;
}
