using FinanzasApp.Domain.Entities;

namespace FinanzasApp.Application.Interfaces;

// Contrato de persistencia para Movimiento.
// Las consultas por rango de fechas viven aca porque filtrar en la base
// es muchisimo mas barato que traer todo y filtrar en memoria.
public interface IRepositorioMovimiento
{
    Task<Movimiento?> ObtenerPorIdAsync(Guid id);
    Task<IReadOnlyList<Movimiento>> ObtenerPorRangoAsync(DateTime desde, DateTime hasta, Guid? cuentaId = null);
    Task<decimal> ObtenerSumaDeCuentaAsync(Guid cuentaId);
    Task AgregarAsync(Movimiento movimiento);
    Task ActualizarAsync(Movimiento movimiento);
}
