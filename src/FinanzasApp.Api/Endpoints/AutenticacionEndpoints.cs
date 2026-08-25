using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FinanzasApp.Api.Autenticacion;

namespace FinanzasApp.Api.Endpoints;

public static class AutenticacionEndpoints
{
    public static void MapearAutenticacion(this IEndpointRouteBuilder app, IHostEnvironment entorno)
    {
        var grupo = app.MapGroup("/api/auth").WithTags("Autenticacion");

        // Publico a proposito: es la puerta de entrada, no puede exigir sesion.
        grupo.MapPost("/google", async (CredencialGoogleRequest peticion, ServicioSesion servicio) =>
            Results.Ok(await servicio.EntrarConGoogleAsync(peticion.Credencial)))
            .AllowAnonymous()
            .WithSummary("Canjea el ID token de Google por un token de sesion de Qwak.");

        // Sirve para dos cosas: mostrar el perfil en Ajustes y, sobre todo, que
        // el frontend pueda preguntar al arrancar si el token guardado sigue
        // vivo, en vez de descubrirlo con un 401 en medio de una pantalla.
        grupo.MapGet("/yo", (ClaimsPrincipal quien) =>
            Results.Ok(new UsuarioDto(
                quien.FindFirstValue(JwtRegisteredClaimNames.Name) ?? string.Empty,
                quien.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty,
                Vacio(quien.FindFirstValue("foto")))))
            .RequireAuthorization()
            .WithSummary("Devuelve el usuario de la sesion actual.");

        if (entorno.IsDevelopment())
        {
            grupo.MapPost("/desarrollo", (ServicioSesion servicio) =>
                Results.Ok(servicio.EntrarComoDesarrollo()))
                .AllowAnonymous()
                .WithSummary("Solo en Development: entra sin Google para poder trabajar en el frontend.");
        }
    }

    private static string? Vacio(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor;
}

public sealed record CredencialGoogleRequest(string Credencial);
