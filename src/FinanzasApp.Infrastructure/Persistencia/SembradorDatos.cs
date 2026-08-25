using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FinanzasApp.Infrastructure.Persistencia;

// Deja la base lista para usar apenas arranca la Api: aplica las migraciones
// pendientes y, si todavia no hay ninguna categoria, carga las tipicas.
//
// No se usa el HasData de EF (que mete los datos dentro de una migracion)
// a proposito: si el usuario da de baja "Mascotas" porque no le sirve, HasData
// se la volveria a insertar en la proxima migracion. Sembrar solo cuando la
// tabla esta vacia respeta lo que el usuario haya hecho despues.
public static class SembradorDatos
{
    // El icono es un nombre de Material Symbols, el mismo catalogo que ofrece
    // el frontend en ICONOS_DISPONIBLES.
    private static readonly (string Nombre, TipoMovimiento Tipo, string Icono)[] CategoriasIniciales =
    [
        ("Sueldo",        TipoMovimiento.Ingreso, "payments"),
        ("Freelance",     TipoMovimiento.Ingreso, "work"),
        ("Intereses",     TipoMovimiento.Ingreso, "savings"),
        ("Otros ingresos", TipoMovimiento.Ingreso, "more_horiz"),

        ("Supermercado",  TipoMovimiento.Egreso, "shopping_cart"),
        ("Comida",        TipoMovimiento.Egreso, "restaurant"),
        ("Alquiler",      TipoMovimiento.Egreso, "home"),
        ("Servicios",     TipoMovimiento.Egreso, "bolt"),
        ("Transporte",    TipoMovimiento.Egreso, "directions_car"),
        ("Salidas",       TipoMovimiento.Egreso, "sports_esports"),
        ("Salud",         TipoMovimiento.Egreso, "medical_services"),
        ("Suscripciones", TipoMovimiento.Egreso, "subscriptions"),
        ("Ropa",          TipoMovimiento.Egreso, "checkroom"),
        ("Educacion",     TipoMovimiento.Egreso, "school"),
        ("Otros gastos",  TipoMovimiento.Egreso, "more_horiz"),
    ];

    public static async Task PrepararBaseAsync(this IServiceProvider proveedor)
    {
        // El DbContext es Scoped, asi que no se puede pedir directo desde el
        // proveedor raiz de la aplicacion: hay que abrir un scope propio.
        using var alcance = proveedor.CreateScope();
        var contexto = alcance.ServiceProvider.GetRequiredService<FinanzasDbContext>();

        // Idempotente: si ya estan aplicadas no hace nada. Sirve sobre todo en
        // el deploy, donde no hay una consola para correr 'dotnet ef'.
        await contexto.Database.MigrateAsync();

        if (await contexto.Categorias.AnyAsync())
            return;

        contexto.Categorias.AddRange(CategoriasIniciales.Select(c => new Categoria
        {
            Nombre = c.Nombre,
            Tipo = c.Tipo,
            Icono = c.Icono
        }));

        await contexto.SaveChangesAsync();
    }
}
