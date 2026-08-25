using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Interfaces;

// Contrato de persistencia para Categoria.
public interface IRepositorioCategoria
{
    Task<Categoria?> ObtenerPorIdAsync(Guid id);
    Task<IReadOnlyList<Categoria>> ObtenerTodasAsync(bool soloActivas = true);
    Task<IReadOnlyList<Categoria>> ObtenerPorTipoAsync(TipoMovimiento tipo);
    Task AgregarAsync(Categoria categoria);
    Task ActualizarAsync(Categoria categoria);
}
