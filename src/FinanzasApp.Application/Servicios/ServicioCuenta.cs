using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Servicios;

// Casos de uso de cuentas. Coordina: valida, arma la entidad y le pide
// al repositorio que la guarde. No sabe donde se guarda.
public class ServicioCuenta
{
    private readonly IRepositorioCuenta _repositorio;
    private readonly IRepositorioMovimiento _repositorioMovimiento;

    public ServicioCuenta(IRepositorioCuenta repositorio, IRepositorioMovimiento repositorioMovimiento)
    {
        _repositorio = repositorio;
        _repositorioMovimiento = repositorioMovimiento;
    }

    public async Task<CuentaDto> CrearAsync(CrearCuentaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new ReglaDeNegocioException("La cuenta necesita un nombre.");

        var cuenta = new Cuenta
        {
            Nombre = request.Nombre.Trim(),
            SaldoInicial = request.SaldoInicial
        };

        await _repositorio.AgregarAsync(cuenta);

        return new CuentaDto(cuenta.Id, cuenta.Nombre, cuenta.SaldoInicial,
            cuenta.SaldoInicial, cuenta.Estado.ToString());
    }

    public async Task<IReadOnlyList<CuentaDto>> ObtenerTodasAsync()
    {
        var cuentas = await _repositorio.ObtenerTodasAsync();
        var resultado = new List<CuentaDto>();

        foreach (var cuenta in cuentas)
        {
            var suma = await _repositorioMovimiento.ObtenerSumaDeCuentaAsync(cuenta.Id);
            resultado.Add(new CuentaDto(cuenta.Id, cuenta.Nombre, cuenta.SaldoInicial,
                cuenta.SaldoInicial + suma, cuenta.Estado.ToString()));
        }

        return resultado;
    }

    public async Task<CuentaDto> ObtenerPorIdAsync(Guid id)
    {
        var cuenta = await _repositorio.ObtenerPorIdAsync(id)
            ?? throw new NoEncontradoException($"No existe la cuenta {id}.");

        var suma = await _repositorioMovimiento.ObtenerSumaDeCuentaAsync(id);

        return new CuentaDto(cuenta.Id, cuenta.Nombre, cuenta.SaldoInicial,
            cuenta.SaldoInicial + suma, cuenta.Estado.ToString());
    }

    public async Task DarDeBajaAsync(Guid id)
    {
        var cuenta = await _repositorio.ObtenerPorIdAsync(id)
            ?? throw new NoEncontradoException($"No existe la cuenta {id}.");

        cuenta.Estado = EstadoRegistro.Inactivo;
        await _repositorio.ActualizarAsync(cuenta);
    }
}
