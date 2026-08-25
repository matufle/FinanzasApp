using FinanzasApp.Application.Servicios;

namespace FinanzasApp.Api.Endpoints;

public static class ReportesEndpoints
{
    public static void MapearReportes(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/reportes").WithTags("Reportes");

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
    }
}
