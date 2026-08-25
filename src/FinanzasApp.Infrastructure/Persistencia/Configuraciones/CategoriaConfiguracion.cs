using FinanzasApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanzasApp.Infrastructure.Persistencia.Configuraciones;

public class CategoriaConfiguracion : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> builder)
    {
        builder.ToTable("categorias");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Tipo).HasConversion<int>().IsRequired();
        builder.Property(c => c.Estado).HasConversion<int>().IsRequired();
        builder.Property(c => c.FechaCreacion).IsRequired();

        builder.HasMany(c => c.Movimientos)
            .WithOne(m => m.Categoria)
            .HasForeignKey(m => m.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.Tipo);
    }
}
