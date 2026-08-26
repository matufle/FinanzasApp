using FinanzasApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinanzasApp.Infrastructure.Persistencia;

// El DbContext es la sesion con la base: representa las tablas y hace de
// unidad de trabajo. Es la unica clase que sabe que existe PostgreSQL.
public class FinanzasDbContext : DbContext
{
    public FinanzasDbContext(DbContextOptions<FinanzasDbContext> options) : base(options) { }

    public DbSet<Cuenta> Cuentas => Set<Cuenta>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Movimiento> Movimientos => Set<Movimiento>();
    public DbSet<SuscripcionPush> SuscripcionesPush => Set<SuscripcionPush>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FinanzasDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // PostgreSQL rechaza fechas que no sean UTC en columnas timestamptz.
        // Este converter las normaliza al guardar y al leer, asi no hay que
        // acordarse de hacerlo en cada servicio.
        configurationBuilder.Properties<DateTime>()
            .HaveConversion<ConversorFechaUtc>();

        // 18 digitos con 2 decimales alcanza para cualquier monto real
        // y evita que el decimal se guarde con precision por defecto.
        configurationBuilder.Properties<decimal>()
            .HavePrecision(18, 2);
    }
}
