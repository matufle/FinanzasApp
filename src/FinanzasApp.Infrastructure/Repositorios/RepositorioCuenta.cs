using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;
using FinanzasApp.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace FinanzasApp.Infrastructure.Repositorios;

// Implementacion concreta del contrato que definio Application.
// Esta es la unica pieza que sabe de EF Core y de PostgreSQL.
public class RepositorioCuenta : IRepositorioCuenta
{
    private readonly FinanzasDbContext _contexto;

    public RepositorioCuenta(FinanzasDbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<Cuenta?> ObtenerPorIdAsync(Guid id) =>
        await _contexto.Cuentas.FirstOrDefaultAsync(c => c.Id == id);

    public async Task<IReadOnlyList<Cuenta>> ObtenerTodasAsync() =>
        await _contexto.Cuentas
            .Where(c => c.Estado == EstadoRegistro.Activo)
            .OrderBy(c => c.Nombre)
            .ToListAsync();

    public async Task AgregarAsync(Cuenta cuenta)
    {
        _contexto.Cuentas.Add(cuenta);
        await _contexto.SaveChangesAsync();
    }

    public async Task ActualizarAsync(Cuenta cuenta)
    {
        _contexto.Cuentas.Update(cuenta);
        await _contexto.SaveChangesAsync();
    }
}
