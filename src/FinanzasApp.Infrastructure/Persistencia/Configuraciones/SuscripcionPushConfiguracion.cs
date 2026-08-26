using FinanzasApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FinanzasApp.Infrastructure.Persistencia.Configuraciones;

public class SuscripcionPushConfiguracion : IEntityTypeConfiguration<SuscripcionPush>
{
    public void Configure(EntityTypeBuilder<SuscripcionPush> builder)
    {
        builder.ToTable("suscripciones_push");
        builder.HasKey(s => s.Id);

        // Los endpoints de Google y Apple son URLs largas; 500 da aire de sobra.
        builder.Property(s => s.Endpoint).HasMaxLength(500).IsRequired();
        builder.Property(s => s.ClaveP256dh).HasMaxLength(200).HasDefaultValue(string.Empty);
        builder.Property(s => s.ClaveAuth).HasMaxLength(100).HasDefaultValue(string.Empty);
        builder.Property(s => s.Dispositivo).HasMaxLength(200).HasDefaultValue(string.Empty);
        builder.Property(s => s.FechaCreacion).IsRequired();

        // El endpoint identifica al navegador: si se vuelve a suscribir manda el
        // mismo, y el indice unico garantiza que no queden dos filas iguales
        // avisandole dos veces a la misma persona.
        builder.HasIndex(s => s.Endpoint).IsUnique();
    }
}
