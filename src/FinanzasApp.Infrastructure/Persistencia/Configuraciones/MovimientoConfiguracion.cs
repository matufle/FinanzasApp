using FinanzasApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanzasApp.Infrastructure.Persistencia.Configuraciones;

public class MovimientoConfiguracion : IEntityTypeConfiguration<Movimiento>
{
    public void Configure(EntityTypeBuilder<Movimiento> builder)
    {
        builder.ToTable("movimientos");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Monto).IsRequired();
        builder.Property(m => m.Tipo).HasConversion<int>().IsRequired();
        builder.Property(m => m.Fecha).IsRequired();
        builder.Property(m => m.Estado).HasConversion<int>().IsRequired();
        builder.Property(m => m.FechaCreacion).IsRequired();

        builder.Property(m => m.Descripcion)
            .HasMaxLength(300)
            .HasDefaultValue(string.Empty);

        // MontoConSigno es una propiedad calculada del dominio, no una columna.
        builder.Ignore(m => m.MontoConSigno);

        // Los reportes siempre filtran por fecha, asi que el indice
        // es lo que evita que la consulta recorra la tabla entera.
        builder.HasIndex(m => m.Fecha);
        builder.HasIndex(m => new { m.CuentaId, m.Fecha });
    }
}
