namespace FinanzasApp.Application.Dtos;

public record CategoriaDto(
    Guid Id,
    string Nombre,
    string Tipo,
    string Estado);

public record CrearCategoriaRequest(string Nombre, string Tipo);
