using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace FinanzasApp.Infrastructure.Persistencia;

// Fuerza que toda fecha viaje a la base como UTC y vuelva marcada como UTC.
public class ConversorFechaUtc : ValueConverter<DateTime, DateTime>
{
    public ConversorFechaUtc() : base(
        fecha => fecha.Kind == DateTimeKind.Utc
            ? fecha
            : DateTime.SpecifyKind(fecha, DateTimeKind.Utc),
        fecha => DateTime.SpecifyKind(fecha, DateTimeKind.Utc))
    { }
}
