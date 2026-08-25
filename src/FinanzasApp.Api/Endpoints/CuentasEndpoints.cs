using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Servicios;

namespace FinanzasApp.Api.Endpoints;

public static class CuentasEndpoints
{
    public static void MapearCuentas(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/cuentas").WithTags("Cuentas");

        grupo.MapGet("/", async (ServicioCuenta servicio) =>
            Results.Ok(await servicio.ObtenerTodasAsync()))
            .WithSummary("Lista las cuentas activas con su saldo actual calculado.");

        grupo.MapGet("/{id:guid}", async (Guid id, ServicioCuenta servicio) =>
            Results.Ok(await servicio.ObtenerPorIdAsync(id)))
            .WithSummary("Trae una cuenta con su saldo actual.");

        grupo.MapPost("/", async (CrearCuentaRequest request, ServicioCuenta servicio) =>
        {
            var creada = await servicio.CrearAsync(request);
            return Results.Created($"/api/cuentas/{creada.Id}", creada);
        })
            .WithSummary("Crea una cuenta nueva.");

        grupo.MapDelete("/{id:guid}", async (Guid id, ServicioCuenta servicio) =>
        {
            await servicio.DarDeBajaAsync(id);
            return Results.NoContent();
        })
            .WithSummary("Da de baja logica una cuenta (no la borra).");
    }
}
