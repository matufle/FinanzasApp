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

    public Task<bool> HuboAltasEntreAsync(DateTime desde, DateTime hasta) =>
        Task.FromResult(Movimientos.Any(m => m.Estado == EstadoRegistro.Activo
                                          && m.FechaCreacion >= desde
                                          && m.FechaCreacion < hasta));

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

public class RepositorioSuscripcionPushFalso : IRepositorioSuscripcionPush
{
    public List<SuscripcionPush> Suscripciones { get; } = [];

    public Task<IReadOnlyList<SuscripcionPush>> ObtenerTodasAsync() =>
        Task.FromResult<IReadOnlyList<SuscripcionPush>>(Suscripciones.ToList());

    public Task<SuscripcionPush?> ObtenerPorEndpointAsync(string endpoint) =>
        Task.FromResult(Suscripciones.FirstOrDefault(s => s.Endpoint == endpoint));

    public Task AgregarAsync(SuscripcionPush suscripcion)
    {
        Suscripciones.Add(suscripcion);
        return Task.CompletedTask;
    }

    public Task ActualizarAsync(SuscripcionPush suscripcion) => Task.CompletedTask;

    public Task EliminarAsync(SuscripcionPush suscripcion)
    {
        Suscripciones.Remove(suscripcion);
        return Task.CompletedTask;
    }
}

// Enviador que no sale a la red: anota a quien se le mando y devuelve el
// resultado que se le pida, para poder probar que las suscripciones vencidas
// se borran solas.
public class EnviadorPushFalso : IEnviadorPush
{
    public List<string> Enviados { get; } = [];
    public ResultadoPush Resultado { get; set; } = ResultadoPush.Entregado;

    public bool Configurado { get; set; } = true;
    public string ClavePublica => "clave-de-prueba";

    public Task<ResultadoPush> EnviarAsync(SuscripcionPush suscripcion, CancellationToken cancelacion = default)
    {
        Enviados.Add(suscripcion.Endpoint);
        return Task.FromResult(Resultado);
    }
}
