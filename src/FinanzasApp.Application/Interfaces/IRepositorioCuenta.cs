using FinanzasApp.Domain.Entities;

namespace FinanzasApp.Application.Interfaces;

// Contrato de persistencia para Cuenta. Application dice que necesita,
// Infrastructure despues decide como lo hace.
public interface IRepositorioCuenta
{
    Task<Cuenta?> ObtenerPorIdAsync(Guid id);
    Task<IReadOnlyList<Cuenta>> ObtenerTodasAsync();
    Task AgregarAsync(Cuenta cuenta);
    Task ActualizarAsync(Cuenta cuenta);
}