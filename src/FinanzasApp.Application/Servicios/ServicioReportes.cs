using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Servicios;

// Arma el resumen que ve el usuario en la pantalla principal:
// totales del periodo y desglose por categoria.
public class ServicioReportes
{
    private readonly IRepositorioMovimiento _repositorio;

    public ServicioReportes(IRepositorioMovimiento repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<ResumenDto> ObtenerResumenAsync(DateTime desde, DateTime hasta, Guid? cuentaId = null)
    {
        if (hasta < desde)
            throw new ReglaDeNegocioException("La fecha 'hasta' no puede ser anterior a 'desde'.");

        var movimientos = await _repositorio.ObtenerPorRangoAsync(desde, hasta, cuentaId);

        var totalIngresos = movimientos
            .Where(m => m.Tipo == TipoMovimiento.Ingreso)
            .Sum(m => m.Monto);

        var totalEgresos = movimientos
            .Where(m => m.Tipo == TipoMovimiento.Egreso)
            .Sum(m => m.Monto);

        var porCategoria = movimientos
            .GroupBy(m => new { m.CategoriaId, Nombre = m.Categoria?.Nombre ?? string.Empty, m.Tipo })
            .Select(g => new ResumenCategoriaDto(
                g.Key.CategoriaId,
                g.Key.Nombre,
                g.Key.Tipo.ToString(),
                g.Sum(m => m.Monto),
                g.Count()))
            .OrderByDescending(r => r.Total)
            .ToList();

        return new ResumenDto(
            desde,
            hasta,
            totalIngresos,
            totalEgresos,
            totalIngresos - totalEgresos,
            porCategoria);
    }
}
