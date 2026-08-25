using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FinanzasApp.Infrastructure.Persistencia;

// Solo la usan las herramientas de EF desde la consola (migrations add,
// database update). EF prefiere esta fabrica por sobre la configuracion de
// la Api, asi que el default apunta a la base local del docker-compose.
// Para correr migraciones contra la nube, exportar DATABASE_URL.
public class FabricaDbContextDiseno : IDesignTimeDbContextFactory<FinanzasDbContext>
{
    private const string CadenaLocal =
        "Host=localhost;Port=5432;Database=finanzas;Username=finanzas;Password=desarrollo_local";

    public FinanzasDbContext CreateDbContext(string[] args)
    {
        var cadena = Environment.GetEnvironmentVariable("DATABASE_URL_DISENO");

        if (string.IsNullOrWhiteSpace(cadena))
            cadena = Environment.GetEnvironmentVariable("DATABASE_URL");

        if (string.IsNullOrWhiteSpace(cadena))
            cadena = CadenaLocal;

        var opciones = new DbContextOptionsBuilder<FinanzasDbContext>()
            .UseNpgsql(cadena)
            .Options;

        return new FinanzasDbContext(opciones);
    }
}
