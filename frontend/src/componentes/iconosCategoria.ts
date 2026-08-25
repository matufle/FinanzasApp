import type { Categoria, TipoMovimiento } from "../api/tipos";

// Catalogo que se le ofrece al usuario cuando crea una categoria.
// Son nombres de Material Symbols; se guardan tal cual en la base.
export const ICONOS_DISPONIBLES = [
  "restaurant",
  "shopping_cart",
  "directions_car",
  "home",
  "medical_services",
  "sports_esports",
  "school",
  "flight",
  "pets",
  "local_gas_station",
  "fitness_center",
  "checkroom",
  "subscriptions",
  "payments",
  "savings",
  "more_horiz",
] as const;

// Categorias creadas antes de que existiera el campo icono, o creadas por la
// API sin elegir uno: se adivina por el nombre en vez de mostrar un hueco.
const POR_NOMBRE: [RegExp, string][] = [
  [/sueldo|salario|honorario/i, "payments"],
  [/super|mercado|almacen/i, "shopping_cart"],
  [/comida|restaurant|delivery/i, "restaurant"],
  [/transporte|colectivo|taxi|auto/i, "directions_car"],
  [/nafta|combustible/i, "local_gas_station"],
  [/salud|medic|farmacia/i, "medical_services"],
  [/ocio|salida|entretenimiento|juego/i, "sports_esports"],
  [/alquiler|casa|hogar|expensas/i, "home"],
  [/educacion|curso|facultad|colegio/i, "school"],
  [/viaje|vuelo|vacacion/i, "flight"],
  [/mascota|perro|gato|veterinar/i, "pets"],
  [/gimnasio|gym|deporte/i, "fitness_center"],
  [/ropa|indumentaria|calzado/i, "checkroom"],
  [/suscripcion|streaming|netflix|spotify/i, "subscriptions"],
  [/ahorro|inversion|plazo/i, "savings"],
];

export function iconoDe(categoria: Pick<Categoria, "nombre" | "icono">): string {
  if (categoria.icono) return categoria.icono;

  for (const [patron, icono] of POR_NOMBRE) {
    if (patron.test(categoria.nombre)) return icono;
  }

  return "category";
}

// Paleta del circulo que rodea al icono. Los ingresos van siempre en verde
// para que se distingan de un vistazo; los egresos rotan entre tres tonos
// segun su id, asi la grilla no queda toda del mismo color pero cada
// categoria conserva siempre el suyo.
const TONOS_EGRESO = [
  { fondo: "bg-primary-fixed", texto: "text-primary-container" },
  { fondo: "bg-tertiary-fixed", texto: "text-tertiary-container" },
  { fondo: "bg-surface-variant", texto: "text-on-surface-variant" },
];

const TONO_INGRESO = { fondo: "bg-secondary-fixed", texto: "text-secondary-container" };

export function coloresDe(categoria: { id: string; tipo: TipoMovimiento }) {
  if (categoria.tipo === "Ingreso") return TONO_INGRESO;

  let suma = 0;
  for (const caracter of categoria.id) suma += caracter.charCodeAt(0);

  return TONOS_EGRESO[suma % TONOS_EGRESO.length];
}

// Las cuentas tampoco tienen campo de icono; se adivina por el nombre igual
// que con las categorias sin icono elegido.
export function iconoDeCuenta(nombre: string): string {
  if (/banco|galicia|santander|naci[oó]n|bbva|brubank/i.test(nombre)) return "account_balance";
  if (/efectivo|cash|billete/i.test(nombre)) return "payments";
  if (/tarjeta|cr[eé]dito|visa|master/i.test(nombre)) return "credit_card";
  if (/ahorro|plazo|inversi[oó]n/i.test(nombre)) return "savings";
  return "account_balance_wallet";
}
