using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Tests.Dobles;

// Implementaciones de los repositorios que guardan todo en una lista en
// memoria. Sirven para probar los servicios de Application sin base de datos:
// lo que se quiere verificar son las reglas y las cuentas, no EF Core.
//
// Se escriben a mano en vez de usar una libreria de mocks porque replicar el
// filtrado por fecha y por estado tal cual lo hace el repositorio real es
// justamente lo que hace que el test valga.

public class RepositorioMovimientoFalso : IRepositorioMovimiento
{
    public List<Movimiento> Movimientos { get; } = [];

    public Task<Movimiento?> ObtenerPorIdAsync(Guid id) =>
        Task.FromResult(Movimientos.FirstOrDefault(m => m.Id == id));

    public Task<IReadOnlyList<Movimiento>> ObtenerPorRangoAsync(
        DateTime desde, DateTime hasta, Guid? cuentaId = null)
    {
        IReadOnlyList<Movimiento> resultado = Movimientos
            .Where(m => m.Estado == EstadoRegistro.Activo
                     && m.Fecha >= desde
                     && m.Fecha <= hasta
                     && (cuentaId == null || m.CuentaId == cuentaId))
            .OrderByDescending(m => m.Fecha)
            .ToList();

        return Task.FromResult(resultado);
    }

    public Task<decimal> ObtenerSumaDeCuentaAsync(Guid cuentaId) =>
        Task.FromResult(Movimientos
            .Where(m => m.CuentaId == cuentaId && m.Estado == EstadoRegistro.Activo)
            .Sum(m => m.MontoConSigno));

    public Task AgregarAsync(Movimiento movimiento)
    {
        Movimientos.Add(movimiento);
        return Task.CompletedTask;
    }

    public Task ActualizarAsync(Movimiento movimiento) => Task.CompletedTask;
}

public class RepositorioCuentaFalso : IRepositorioCuenta
{
    public List<Cuenta> Cuentas { get; } = [];

    public Task<Cuenta?> ObtenerPorIdAsync(Guid id) =>
        Task.FromResult(Cuentas.FirstOrDefault(c => c.Id == id));

    public Task<IReadOnlyList<Cuenta>> ObtenerTodasAsync() =>
        Task.FromResult<IReadOnlyList<Cuenta>>(Cuentas
            .Where(c => c.Estado == EstadoRegistro.Activo)
            .ToList());

    public Task AgregarAsync(Cuenta cuenta)
    {
        Cuentas.Add(cuenta);
        return Task.CompletedTask;
    }

    public Task ActualizarAsync(Cuenta cuenta) => Task.CompletedTask;
}

public class RepositorioCategoriaFalso : IRepositorioCategoria
{
    public List<Categoria> Categorias { get; } = [];

    public Task<Categoria?> ObtenerPorIdAsync(Guid id) =>
        Task.FromResult(Categorias.FirstOrDefault(c => c.Id == id));

    public Task<IReadOnlyList<Categoria>> ObtenerTodasAsync(bool soloActivas = true) =>
        Task.FromResult<IReadOnlyList<Categoria>>(Categorias
            .Where(c => !soloActivas || c.Estado == EstadoRegistro.Activo)
            .ToList());

    public Task<IReadOnlyList<Categoria>> ObtenerPorTipoAsync(TipoMovimiento tipo) =>
        Task.FromResult<IReadOnlyList<Categoria>>(Categorias
            .Where(c => c.Estado == EstadoRegistro.Activo && c.Tipo == tipo)
            .ToList());

    public Task AgregarAsync(Categoria categoria)
    {
        Categorias.Add(categoria);
        return Task.CompletedTask;
    }

    public Task ActualizarAsync(Categoria categoria) => Task.CompletedTask;
}
