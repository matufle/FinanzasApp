using FinanzasApp.Application.Interfaces;
using FinanzasApp.Application.Servicios;
using FinanzasApp.Infrastructure.Persistencia;
using FinanzasApp.Infrastructure.Repositorios;
using Microsoft.EntityFrameworkCore;
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

        servicios.AddScoped<ServicioCuenta>();
        servicios.AddScoped<ServicioCategoria>();
        servicios.AddScoped<ServicioMovimiento>();
        servicios.AddScoped<ServicioReportes>();

        return servicios;
    }
}
