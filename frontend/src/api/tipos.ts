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
