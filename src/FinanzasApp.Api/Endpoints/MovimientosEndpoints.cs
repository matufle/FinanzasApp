using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Servicios;

namespace FinanzasApp.Api.Endpoints;

public static class MovimientosEndpoints
{
    public static void MapearMovimientos(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/movimientos").WithTags("Movimientos");

        // Si no mandan fechas, por defecto devuelve el mes en curso,
        // que es lo que el frontend va a querer mostrar al abrir la app.
        grupo.MapGet("/", async (
            DateTime? desde,
            DateTime? hasta,
            Guid? cuentaId,
            ServicioMovimiento servicio) =>
        {
            var (inicio, fin) = RangoPorDefecto(desde, hasta);
            return Results.Ok(await servicio.ObtenerPorRangoAsync(inicio, fin, cuentaId));
        })
            .WithSummary("Lista movimientos por rango de fechas. Sin parametros devuelve el mes actual.");

        grupo.MapPost("/", async (CrearMovimientoRequest request, ServicioMovimiento servicio) =>
        {
            var creado = await servicio.CrearAsync(request);
            return Results.Created($"/api/movimientos/{creado.Id}", creado);
        })
            .WithSummary("Registra un ingreso o egreso.");

        grupo.MapDelete("/{id:guid}", async (Guid id, ServicioMovimiento servicio) =>
        {
            await servicio.AnularAsync(id);
            return Results.NoContent();
        })
            .WithSummary("Anula un movimiento (baja logica).");
    }

    internal static (DateTime Desde, DateTime Hasta) RangoPorDefecto(DateTime? desde, DateTime? hasta)
    {
        var hoy = DateTime.UtcNow;
        var inicio = desde ?? new DateTime(hoy.Year, hoy.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var fin = hasta ?? inicio.AddMonths(1).AddTicks(-1);
        return (inicio, fin);
    }
}
