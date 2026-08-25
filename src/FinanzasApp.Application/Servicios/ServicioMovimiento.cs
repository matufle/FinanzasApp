using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Servicios;

// Este es el caso de uso mas cargado de reglas: antes de guardar un movimiento
// hay que verificar que la cuenta y la categoria existan, y que el tipo del
// movimiento coincida con el tipo de la categoria elegida.
public class ServicioMovimiento
{
    private readonly IRepositorioMovimiento _repositorio;
    private readonly IRepositorioCuenta _repositorioCuenta;
    private readonly IRepositorioCategoria _repositorioCategoria;

    public ServicioMovimiento(
        IRepositorioMovimiento repositorio,
        IRepositorioCuenta repositorioCuenta,
        IRepositorioCategoria repositorioCategoria)
    {
        _repositorio = repositorio;
        _repositorioCuenta = repositorioCuenta;
        _repositorioCategoria = repositorioCategoria;
    }

    public async Task<MovimientoDto> CrearAsync(CrearMovimientoRequest request)
    {
        if (request.Monto <= 0)
            throw new ReglaDeNegocioException("El monto tiene que ser mayor a cero.");

        if (!Enum.TryParse<TipoMovimiento>(request.Tipo, ignoreCase: true, out var tipo))
            throw new ReglaDeNegocioException("El tipo debe ser 'Ingreso' o 'Egreso'.");

        var cuenta = await _repositorioCuenta.ObtenerPorIdAsync(request.CuentaId)
            ?? throw new NoEncontradoException($"No existe la cuenta {request.CuentaId}.");

        var categoria = await _repositorioCategoria.ObtenerPorIdAsync(request.CategoriaId)
            ?? throw new NoEncontradoException($"No existe la categoria {request.CategoriaId}.");

        if (categoria.Tipo != tipo)
            throw new ReglaDeNegocioException(
                $"La categoria '{categoria.Nombre}' es de tipo {categoria.Tipo}, " +
                $"no se puede usar en un movimiento de tipo {tipo}.");

        var movimiento = new Movimiento
        {
            Monto = request.Monto,
            Tipo = tipo,
            Fecha = request.Fecha,
            Descripcion = request.Descripcion?.Trim() ?? string.Empty,
            CuentaId = request.CuentaId,
            CategoriaId = request.CategoriaId
        };

        await _repositorio.AgregarAsync(movimiento);

        return new MovimientoDto(movimiento.Id, movimiento.Monto, movimiento.Tipo.ToString(),
            movimiento.Fecha, movimiento.Descripcion, cuenta.Id, cuenta.Nombre,
            categoria.Id, categoria.Nombre);
    }

    public async Task<IReadOnlyList<MovimientoDto>> ObtenerPorRangoAsync(
        DateTime desde, DateTime hasta, Guid? cuentaId = null)
    {
        if (hasta < desde)
            throw new ReglaDeNegocioException("La fecha 'hasta' no puede ser anterior a 'desde'.");

        var movimientos = await _repositorio.ObtenerPorRangoAsync(desde, hasta, cuentaId);

        return movimientos.Select(m => new MovimientoDto(
            m.Id, m.Monto, m.Tipo.ToString(), m.Fecha, m.Descripcion,
            m.CuentaId, m.Cuenta?.Nombre ?? string.Empty,
            m.CategoriaId, m.Categoria?.Nombre ?? string.Empty)).ToList();
    }

    public async Task AnularAsync(Guid id)
    {
        var movimiento = await _repositorio.ObtenerPorIdAsync(id)
            ?? throw new NoEncontradoException($"No existe el movimiento {id}.");

        movimiento.Estado = EstadoRegistro.Inactivo;
        await _repositorio.ActualizarAsync(movimiento);
    }
}
