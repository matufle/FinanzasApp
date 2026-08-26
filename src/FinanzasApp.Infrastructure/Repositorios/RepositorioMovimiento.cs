using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;
using FinanzasApp.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace FinanzasApp.Infrastructure.Repositorios;

public class RepositorioMovimiento : IRepositorioMovimiento
{
    private readonly FinanzasDbContext _contexto;

    public RepositorioMovimiento(FinanzasDbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<Movimiento?> ObtenerPorIdAsync(Guid id) =>
        await _contexto.Movimientos.FirstOrDefaultAsync(m => m.Id == id);

    public async Task<IReadOnlyList<Movimiento>> ObtenerPorRangoAsync(
        DateTime desde, DateTime hasta, Guid? cuentaId = null)
    {
        // Include trae la cuenta y la categoria en la misma consulta.
        // Sin esto las propiedades de navegacion vendrian en null.
        var consulta = _contexto.Movimientos
            .Include(m => m.Cuenta)
            .Include(m => m.Categoria)
            .Where(m => m.Estado == EstadoRegistro.Activo
                     && m.Fecha >= desde
                     && m.Fecha <= hasta);

        if (cuentaId.HasValue)
            consulta = consulta.Where(m => m.CuentaId == cuentaId.Value);

        return await consulta.OrderByDescending(m => m.Fecha).ToListAsync();
    }

    public async Task<decimal> ObtenerSumaDeCuentaAsync(Guid cuentaId)
    {
        // La suma se hace en la base, no trayendo los movimientos a memoria.
        // No se puede usar MontoConSigno aca porque es una propiedad de C#
        // que la base no conoce, asi que se repite la logica en la consulta.
        var movimientos = _contexto.Movimientos
            .Where(m => m.CuentaId == cuentaId && m.Estado == EstadoRegistro.Activo);

        var ingresos = await movimientos
            .Where(m => m.Tipo == TipoMovimiento.Ingreso)
            .SumAsync(m => (decimal?)m.Monto) ?? 0m;

        var egresos = await movimientos
            .Where(m => m.Tipo == TipoMovimiento.Egreso)
            .SumAsync(m => (decimal?)m.Monto) ?? 0m;

        return ingresos - egresos;
    }

    public async Task<bool> HuboAltasEntreAsync(DateTime desde, DateTime hasta) =>
        await _contexto.Movimientos.AnyAsync(m =>
            m.Estado == EstadoRegistro.Activo
            && m.FechaCreacion >= desde
            && m.FechaCreacion < hasta);

    public async Task AgregarAsync(Movimiento movimiento)
    {
        _contexto.Movimientos.Add(movimiento);
        await _contexto.SaveChangesAsync();
    }

    public async Task ActualizarAsync(Movimiento movimiento)
    {
        _contexto.Movimientos.Update(movimiento);
        await _contexto.SaveChangesAsync();
    }
}
