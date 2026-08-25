using FinanzasApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanzasApp.Infrastructure.Persistencia.Configuraciones;

// Aca se define como se mapea Cuenta a su tabla. Va separado del DbContext
// para que cada entidad tenga su archivo y no quede un OnModelCreating gigante.
public class CuentaConfiguracion : IEntityTypeConfiguration<Cuenta>
{
    public void Configure(EntityTypeBuilder<Cuenta> builder)
    {
        builder.ToTable("cuentas");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.SaldoInicial).IsRequired();
        builder.Property(c => c.Estado).HasConversion<int>().IsRequired();
        builder.Property(c => c.FechaCreacion).IsRequired();

        builder.HasMany(c => c.Movimientos)
            .WithOne(m => m.Cuenta)
            .HasForeignKey(m => m.CuentaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.Estado);
    }
}
