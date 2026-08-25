// Formato argentino: punto para los miles y coma para los centavos.
// El simbolo $ va aparte porque el diseño lo muestra en otro tamaño que el numero.
const FORMATEADOR = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatearMonto(valor: number): string {
  return FORMATEADOR.format(valor);
}

// Version con simbolo, para textos corridos como "Saldo inicial: $ 80.000,00".
export function formatearMontoConSimbolo(valor: number): string {
  return `$ ${FORMATEADOR.format(valor)}`;
}

// --- Fechas ---

// Las fechas de la Api vienen como "2026-08-24T00:00:00Z". Cortar el string en
// vez de construir un Date evita que la zona horaria mueva el dia un casillero.
export function soloFecha(iso: string): string {
  return iso.slice(0, 10);
}

const NOMBRE_MES = new Intl.DateTimeFormat("es-AR", { month: "long" });
const DIA_LARGO = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function desdeIso(fecha: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function isoDeFecha(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Encabezado de cada grupo de la lista: "Hoy, 24 de agosto" o "lunes 23 de agosto".
export function etiquetaDia(fecha: string, hoy: string): string {
  const dia = desdeIso(fecha);

  if (fecha === hoy) return `Hoy, ${dia.getDate()} de ${NOMBRE_MES.format(dia)}`;

  const ayer = desdeIso(hoy);
  ayer.setDate(ayer.getDate() - 1);

  if (fecha === isoDeFecha(ayer)) return `Ayer, ${dia.getDate()} de ${NOMBRE_MES.format(dia)}`;

  return DIA_LARGO.format(dia);
}

// Rango del mes que se esta mirando, como lo muestra la barra: "1 - 31 de agosto 2026".
export function etiquetaMes(anio: number, mes: number): string {
  const ultimo = new Date(anio, mes + 1, 0).getDate();
  return `1 - ${ultimo} de ${NOMBRE_MES.format(new Date(anio, mes, 1))} ${anio}`;
}

// Primer y ultimo dia del mes, en el formato que espera la Api.
export function rangoDelMes(anio: number, mes: number): { desde: string; hasta: string } {
  return {
    desde: isoDeFecha(new Date(anio, mes, 1)),
    hasta: isoDeFecha(new Date(anio, mes + 1, 0)),
  };
}

// Titulo del navegador de mes del encabezado: "agosto 2026".
export function nombreMesAnio(anio: number, mes: number): string {
  const nombre = NOMBRE_MES.format(new Date(anio, mes, 1));
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}
