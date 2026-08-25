namespace FinanzasApp.Application.Dtos;

public record CategoriaDto(
    Guid Id,
    string Nombre,
    string Tipo,
    string? Icono,
    string Estado);

public record CrearCategoriaRequest(string Nombre, string Tipo, string? Icono = null);
