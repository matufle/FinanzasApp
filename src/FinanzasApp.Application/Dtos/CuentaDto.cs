namespace FinanzasApp.Application.Dtos;

// Lo que la API devuelve al frontend. No exponemos la entidad directamente
// para que un cambio interno del dominio no rompa el contrato HTTP.
public record CuentaDto(
    Guid Id,
    string Nombre,
    decimal SaldoInicial,
    decimal SaldoActual,
    string Estado);

public record CrearCuentaRequest(string Nombre, decimal SaldoInicial);
