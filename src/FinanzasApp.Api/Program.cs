using FinanzasApp.Api.Configuracion;
using FinanzasApp.Api.Endpoints;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Infrastructure;
using FinanzasApp.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Diagnostics;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AgregarInfraestructura(CadenaConexion.Resolver(builder.Configuration));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

// El frontend generado con Stitch se sirve desde otro origen, asi que
// el navegador bloquea las llamadas salvo que la API lo autorice.
// Los origenes se configuran por appsettings o variable de entorno.
var origenesPermitidos = builder.Configuration
    .GetSection("Cors:OrigenesPermitidos")
    .Get<string[]>() ?? ["http://localhost:3000", "http://localhost:5173"];

builder.Services.AddCors(opciones =>
    opciones.AddDefaultPolicy(politica => politica
        .WithOrigins(origenesPermitidos)
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// Aplica las migraciones pendientes y, si la base no tiene ninguna categoria,
// carga las tipicas. Asi la app nunca arranca sin nada que elegir, y el deploy
// no necesita una consola para correr 'dotnet ef'.
await app.Services.PrepararBaseAsync();

// Traduce las excepciones del dominio a codigos HTTP correctos,
// para que el frontend reciba 404 o 400 en vez de un 500 generico.
app.UseExceptionHandler(manejador => manejador.Run(async contexto =>
{
    var excepcion = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;

    var (codigo, titulo) = excepcion switch
    {
        NoEncontradoException => (StatusCodes.Status404NotFound, "Recurso no encontrado"),
        ReglaDeNegocioException => (StatusCodes.Status400BadRequest, "Solicitud invalida"),
        _ => (StatusCodes.Status500InternalServerError, "Error interno")
    };

    contexto.Response.StatusCode = codigo;
    await contexto.Response.WriteAsJsonAsync(new
    {
        titulo,
        detalle = codigo == StatusCodes.Status500InternalServerError
            ? "Ocurrio un error inesperado."
            : excepcion?.Message
    });
}));

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapGet("/", () => Results.Ok(new { servicio = "FinanzasApp", estado = "ok" }));

app.MapearCuentas();
app.MapearCategorias();
app.MapearMovimientos();
app.MapearReportes();

app.Run();
