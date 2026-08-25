using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Servicios;

// Calcula las metricas de un mes: tasa de ahorro, comparacion con el mes
// anterior, proyeccion a fin de mes y el flujo de caja de los ultimos meses.
//
// Se hace una sola consulta a la base que cubre toda la ventana de meses y
// despues se agrupa en memoria. Para una app personal son unos cientos de
// filas, y una consulta contra Postgres gestionado cuesta mucho mas que
// recorrer esa lista.
public class ServicioMetricas
{
    // Los nombres de mes van escritos a mano en vez de salir de CultureInfo
    // porque los contenedores de .NET suelen ir con globalizacion invariante,
    // y ahi "agosto" saldria en ingles.
    private static readonly string[] MesesCortos =
        ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

    private const int MesesFlujoMinimo = 2;
    private const int MesesFlujoMaximo = 24;

    private readonly IRepositorioMovimiento _repositorio;

    public ServicioMetricas(IRepositorioMovimiento repositorio)
    {
        _repositorio = repositorio;
    }

    // 'hoy' es un parametro para poder testear la proyeccion sin depender del
    // reloj; la Api no lo manda y cae en la fecha real.
    public async Task<MetricasDto> ObtenerAsync(
        int anio,
        int mes,
        Guid? cuentaId = null,
        int mesesFlujo = 6,
        DateTime? hoy = null)
    {
        if (mes is < 1 or > 12)
            throw new ReglaDeNegocioException("El mes debe estar entre 1 y 12.");

        if (anio is < 2000 or > 2100)
            throw new ReglaDeNegocioException("El anio debe estar entre 2000 y 2100.");

        mesesFlujo = Math.Clamp(mesesFlujo, MesesFlujoMinimo, MesesFlujoMaximo);

        // La ventana termina al final del mes que se esta mirando y arranca
        // tantos meses atras como pida el flujo de caja. El mes anterior, que
        // se usa para comparar, siempre cae adentro porque el minimo es 2.
        var finDeMes = PrimerDia(anio, mes).AddMonths(1);
        var inicioVentana = finDeMes.AddMonths(-mesesFlujo);
        var finVentana = finDeMes.AddTicks(-1);

        var movimientos = await _repositorio.ObtenerPorRangoAsync(inicioVentana, finVentana, cuentaId);

        // Un periodo por cada mes de la ventana, incluidos los meses sin
        // movimientos: el grafico de barras necesita la columna vacia igual.
        var flujo = Enumerable.Range(0, mesesFlujo)
            .Select(i => inicioVentana.AddMonths(i))
            .Select(inicio => ArmarPeriodo(inicio.Year, inicio.Month, movimientos))
            .ToList();

        var actual = flujo[^1];
        var anterior = flujo[^2];

        return new MetricasDto(
            actual,
            anterior,
            Comparar(actual, anterior),
            CalcularTasaDeAhorro(actual),
            Proyectar(actual, (hoy ?? DateTime.UtcNow).Date),
            flujo,
            TopEgresos(anio, mes, movimientos));
    }

    private static DateTime PrimerDia(int anio, int mes) =>
        new(anio, mes, 1, 0, 0, 0, DateTimeKind.Utc);

    private static PeriodoDto ArmarPeriodo(int anio, int mes, IReadOnlyList<Movimiento> movimientos)
    {
        var delMes = movimientos.Where(m => m.Fecha.Year == anio && m.Fecha.Month == mes).ToList();

        var ingresos = delMes.Where(m => m.Tipo == TipoMovimiento.Ingreso).Sum(m => m.Monto);
        var egresos = delMes.Where(m => m.Tipo == TipoMovimiento.Egreso).Sum(m => m.Monto);

        return new PeriodoDto(
            anio,
            mes,
            $"{MesesCortos[mes - 1]} {anio}",
            ingresos,
            egresos,
            ingresos - egresos);
    }

    private static ComparativaDto Comparar(PeriodoDto actual, PeriodoDto anterior) =>
        new(
            actual.Ingresos - anterior.Ingresos,
            Variacion(actual.Ingresos, anterior.Ingresos),
            actual.Egresos - anterior.Egresos,
            Variacion(actual.Egresos, anterior.Egresos),
            actual.Balance - anterior.Balance);

    // Cuanto creció o bajó respecto de la base, en proporcion: 0,15 es "15% mas".
    // Si la base es cero no hay porcentaje posible (todo aumento seria infinito),
    // asi que se devuelve null y la pantalla muestra la diferencia en plata.
    private static decimal? Variacion(decimal valor, decimal baseAnterior)
    {
        if (baseAnterior == 0) return null;
        return Math.Round((valor - baseAnterior) / baseAnterior, 4);
    }

    // Que porcentaje de lo que entro sobrevivio al mes. Puede dar negativo si
    // se gasto mas de lo que entro, y eso es informacion util: no se recorta.
    private static decimal? CalcularTasaDeAhorro(PeriodoDto periodo)
    {
        if (periodo.Ingresos <= 0) return null;
        return Math.Round(periodo.Balance / periodo.Ingresos, 4);
    }

    private static ProyeccionDto Proyectar(PeriodoDto periodo, DateTime hoy)
    {
        var diasDelMes = DateTime.DaysInMonth(periodo.Anio, periodo.Mes);
        var diasTranscurridos = DiasTranscurridos(periodo, hoy, diasDelMes);

        var promedioDiario = diasTranscurridos > 0
            ? Math.Round(periodo.Egresos / diasTranscurridos, 2)
            : 0m;

        // Se proyecta desde el egreso crudo y se redondea recien al final. Si se
        // multiplicara el promedio ya redondeado, el error por centavos se
        // repetiria una vez por dia: un mes cerrado con 60.000 de gasto se
        // proyectaria a 59.999,88 en vez de a los 60.000 que realmente fueron.
        var egresosProyectados = diasTranscurridos > 0
            ? Math.Round(periodo.Egresos * diasDelMes / diasTranscurridos, 2)
            : 0m;

        // Los ingresos no se proyectan: el sueldo entra de golpe una vez al mes,
        // asi que estirarlo por dia daria un numero sin sentido. Se proyecta el
        // gasto, que si es parejo, y se compara contra lo que ya entro.
        var balanceProyectado = periodo.Ingresos - egresosProyectados;

        var diasRestantes = diasDelMes - diasTranscurridos;
        var disponiblePorDia = diasRestantes > 0 && periodo.Balance > 0
            ? Math.Round(periodo.Balance / diasRestantes, 2)
            : 0m;

        return new ProyeccionDto(
            diasTranscurridos,
            diasDelMes,
            promedioDiario,
            egresosProyectados,
            balanceProyectado,
            disponiblePorDia);
    }

    // Un mes ya cerrado cuenta como transcurrido entero (su proyeccion es lo
    // que realmente paso); uno que todavia no empezo cuenta cero.
    private static int DiasTranscurridos(PeriodoDto periodo, DateTime hoy, int diasDelMes)
    {
        if (periodo.Anio == hoy.Year && periodo.Mes == hoy.Month) return hoy.Day;

        var inicioPeriodo = PrimerDia(periodo.Anio, periodo.Mes);
        var inicioActual = PrimerDia(hoy.Year, hoy.Month);

        return inicioPeriodo < inicioActual ? diasDelMes : 0;
    }

    private static IReadOnlyList<ResumenCategoriaDto> TopEgresos(
        int anio, int mes, IReadOnlyList<Movimiento> movimientos) =>
        movimientos
            .Where(m => m.Tipo == TipoMovimiento.Egreso
                     && m.Fecha.Year == anio
                     && m.Fecha.Month == mes)
            .GroupBy(m => new { m.CategoriaId, Nombre = m.Categoria?.Nombre ?? string.Empty })
            .Select(g => new ResumenCategoriaDto(
                g.Key.CategoriaId,
                g.Key.Nombre,
                nameof(TipoMovimiento.Egreso),
                g.Sum(m => m.Monto),
                g.Count()))
            .OrderByDescending(c => c.Total)
            .ToList();
}
