namespace FinanzasApp.Application.Dtos;

public record MovimientoDto(
    Guid Id,
    decimal Monto,
    string Tipo,
    DateTime Fecha,
    string Descripcion,
    Guid CuentaId,
    string CuentaNombre,
    Guid CategoriaId,
    string CategoriaNombre);

public record CrearMovimientoRequest(
    decimal Monto,
    string Tipo,
    DateTime Fecha,
    string Descripcion,
    Guid CuentaId,
    Guid CategoriaId);
