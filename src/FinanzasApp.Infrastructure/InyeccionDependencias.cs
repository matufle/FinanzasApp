using FinanzasApp.Application.Interfaces;
using FinanzasApp.Application.Servicios;
using FinanzasApp.Infrastructure.Notificaciones;
using FinanzasApp.Infrastructure.Persistencia;
using FinanzasApp.Infrastructure.Repositorios;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FinanzasApp.Infrastructure;

// Aca se conecta cada interfaz con su implementacion concreta.
// Es el unico lugar donde se decide que Application va a recibir
// repositorios de PostgreSQL y no otra cosa.
public static class InyeccionDependencias
{
    public static IServiceCollection AgregarInfraestructura(
        this IServiceCollection servicios, string cadenaConexion)
    {
        servicios.AddDbContext<FinanzasDbContext>(opciones =>
            opciones.UseNpgsql(cadenaConexion));

        servicios.AddScoped<IRepositorioCuenta, RepositorioCuenta>();
        servicios.AddScoped<IRepositorioCategoria, RepositorioCategoria>();
        servicios.AddScoped<IRepositorioMovimiento, RepositorioMovimiento>();
        servicios.AddScoped<IRepositorioSuscripcionPush, RepositorioSuscripcionPush>();

        servicios.AddScoped<ServicioCuenta>();
        servicios.AddScoped<ServicioCategoria>();
        servicios.AddScoped<ServicioMovimiento>();
        servicios.AddScoped<ServicioReportes>();
        servicios.AddScoped<ServicioMetricas>();
        servicios.AddScoped<ServicioNotificaciones>();

        return servicios;
    }

    // Notificaciones push. Va aparte de AgregarInfraestructura porque necesita
    // la configuracion entera (las claves VAPID) y no solo la cadena de conexion.
    public static IServiceCollection AgregarNotificaciones(
        this IServiceCollection servicios, IConfiguration configuracion)
    {
        servicios.Configure<OpcionesPush>(configuracion.GetSection(OpcionesPush.Seccion));

        // Con AddHttpClient el cliente se reusa entre envios en vez de abrir
        // una conexion nueva por cada notificacion.
        servicios.AddHttpClient<IEnviadorPush, EnviadorPushWeb>(cliente =>
            cliente.Timeout = TimeSpan.FromSeconds(15));

        return servicios;
    }
}
