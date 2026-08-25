using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Servicios;

namespace FinanzasApp.Api.Endpoints;

public static class CategoriasEndpoints
{
    public static void MapearCategorias(this IEndpointRouteBuilder app)
    {
        var grupo = app.MapGroup("/api/categorias").WithTags("Categorias");

        grupo.MapGet("/", async (string? tipo, ServicioCategoria servicio) =>
            Results.Ok(await servicio.ObtenerTodasAsync(tipo)))
            .WithSummary("Lista las categorias activas. Se puede filtrar por tipo=Ingreso|Egreso.");

        grupo.MapPost("/", async (CrearCategoriaRequest request, ServicioCategoria servicio) =>
        {
            var creada = await servicio.CrearAsync(request);
            return Results.Created($"/api/categorias/{creada.Id}", creada);
        })
            .WithSummary("Crea una categoria nueva.");

        grupo.MapDelete("/{id:guid}", async (Guid id, ServicioCategoria servicio) =>
        {
            await servicio.DarDeBajaAsync(id);
            return Results.NoContent();
        })
            .WithSummary("Da de baja logica una categoria.");
    }
}
