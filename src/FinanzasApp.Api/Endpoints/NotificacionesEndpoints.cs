using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Servicios;
using FinanzasApp.Infrastructure.Notificaciones;
using Microsoft.Extensions.Options;

namespace FinanzasApp.Api.Endpoints;

public static class NotificacionesEndpoints
{
    // Cabecera con la que el programador de tareas se identifica para disparar
    // el recordatorio. No es una sesion de usuario: lo llama una maquina.
    private const string CabeceraRecordatorio = "X-Qwak-Recordatorio";

    public static void MapearNotificaciones(this IEndpointRouteBuilder app, IHostEnvironment entorno)
    {
        var grupo = app.MapGroup("/api/notificaciones").WithTags("Notificaciones")
            .RequireAuthorization();

        // El navegador necesita la clave publica del servidor para poder
        // suscribirse. Tambien dice si el servidor tiene las claves cargadas,
        // asi Ajustes puede explicar por que no se puede activar.
        grupo.MapGet("/clave-publica", (ServicioNotificaciones servicio) =>
            Results.Ok(new
            {
                habilitado = servicio.Configurado,
                clavePublica = servicio.ClavePublica
            }))
            .WithSummary("Clave publica VAPID con la que el navegador arma la suscripcion.");

        grupo.MapPost("/suscripciones", async (
            SuscripcionPushRequest peticion, ServicioNotificaciones servicio) =>
        {
            await servicio.RegistrarAsync(peticion);
            return Results.NoContent();
        })
            .WithSummary("Registra este navegador para recibir avisos.");

        // La baja va por POST y no por DELETE porque el endpoint viaja en el
        // cuerpo: es una URL larga y meterla en la ruta la deja ilegible.
        grupo.MapPost("/suscripciones/baja", async (
            BajaRequest peticion, ServicioNotificaciones servicio) =>
        {
            await servicio.DarDeBajaAsync(peticion.Endpoint);
            return Results.NoContent();
        })
            .WithSummary("Deja de mandarle avisos a este navegador.");

        // Para que Ajustes pueda mostrar el interruptor prendido cuando el
        // navegador ya esta suscripto de una sesion anterior.
        grupo.MapGet("/suscripciones/estado", async (
            string endpoint, ServicioNotificaciones servicio) =>
            Results.Ok(new { suscripto = await servicio.EstaSuscriptoAsync(endpoint) }))
            .WithSummary("Dice si un endpoint del navegador ya esta registrado.");

        grupo.MapPost("/prueba", async (ServicioNotificaciones servicio, CancellationToken ct) =>
            Results.Ok(await servicio.EnviarPruebaAsync(ct)))
            .WithSummary("Manda el aviso ahora mismo, para probar que llega.");

        // Fuera del grupo: este no lo llama el navegador con sesion, lo llama
        // Cloud Scheduler a la hora configurada, y se autentica con el secreto
        // compartido de la cabecera.
        app.MapPost("/api/notificaciones/recordatorio-diario", async (
            HttpContext contexto,
            ServicioNotificaciones servicio,
            IOptions<OpcionesPush> opciones,
            CancellationToken ct) =>
        {
            var esperada = opciones.Value.ClaveRecordatorio;

            if (string.IsNullOrWhiteSpace(esperada))
                return Results.Problem("El recordatorio diario no esta configurado.", statusCode: 503);

            if (contexto.Request.Headers[CabeceraRecordatorio] != esperada)
                return Results.Unauthorized();

            var (inicio, fin) = DiaLocalEnUtc(DateTime.UtcNow, opciones.Value.DesfasajeHoras);
            return Results.Ok(await servicio.EnviarRecordatorioDiarioAsync(inicio, fin, ct));
        })
            .AllowAnonymous()
            .WithTags("Notificaciones")
            .WithSummary("Avisa si todavia no se cargo ningun movimiento hoy. Lo llama el programador de tareas.");

        if (entorno.IsDevelopment())
        {
            // Ayuda de puesta en marcha: genera un par de claves VAPID para
            // copiar a las variables de entorno. Solo en Development, porque
            // devuelve una clave privada por HTTP.
            grupo.MapPost("/claves-nuevas", () => Results.Ok(ClavesVapid.Generar()))
                .WithSummary("Solo en Development: genera un par de claves VAPID para configurar el servidor.");
        }
    }

    // Devuelve en que instantes UTC empieza y termina el dia de hoy segun la
    // hora local. Con desfasaje -3, el dia local del 26/08 va desde las 03:00
    // UTC del 26 hasta las 03:00 UTC del 27.
    internal static (DateTime Inicio, DateTime Fin) DiaLocalEnUtc(DateTime ahoraUtc, double desfasajeHoras)
    {
        var desfasaje = TimeSpan.FromHours(desfasajeHoras);
        var inicioLocal = (ahoraUtc + desfasaje).Date;

        return (inicioLocal - desfasaje, inicioLocal.AddDays(1) - desfasaje);
    }
}

public sealed record BajaRequest(string Endpoint);
