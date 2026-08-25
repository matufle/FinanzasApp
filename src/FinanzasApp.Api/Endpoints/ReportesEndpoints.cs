using FinanzasApp.Application.Servicios;

namespace FinanzasApp.Api.Endpoints;

public static class ReportesEndpoints
{
    public static void MapearReportes(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/reportes").WithTags("Reportes")
            // Todo lo que hay abajo es plata del usuario: sin sesion valida, 401.
            .RequireAuthorization();

        grupo.MapGet("/resumen", async (
            DateTime? desde,
            DateTime? hasta,
            Guid? cuentaId,
            ServicioReportes servicio) =>
        {
            var (inicio, fin) = MovimientosEndpoints.RangoPorDefecto(desde, hasta);
            return Results.Ok(await servicio.ObtenerResumenAsync(inicio, fin, cuentaId));
        })
            .WithSummary("Totales de ingresos, egresos, balance y desglose por categoria.");

        // Las metricas se piden por mes calendario y no por rango libre: tasa
        // de ahorro, comparacion contra el mes anterior y proyeccion a fin de
        // mes solo tienen sentido sobre un mes entero.
        grupo.MapGet("/metricas", async (
            int? anio,
            int? mes,
            Guid? cuentaId,
            int? meses,
            ServicioMetricas servicio) =>
        {
            var hoy = DateTime.UtcNow;
            return Results.Ok(await servicio.ObtenerAsync(
                anio ?? hoy.Year,
                mes ?? hoy.Month,
                cuentaId,
                meses ?? 6));
        })
            .WithSummary("Tasa de ahorro, comparativa contra el mes anterior, proyeccion a fin de mes, flujo de caja y top de egresos.");
    }
}
