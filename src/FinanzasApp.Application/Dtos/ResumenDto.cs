namespace FinanzasApp.Application.Dtos;

// Lo que se muestra en la pantalla principal: cuanto entro, cuanto salio
// y el desglose por categoria del periodo consultado.
public record ResumenDto(
    DateTime Desde,
    DateTime Hasta,
    decimal TotalIngresos,
    decimal TotalEgresos,
    decimal Balance,
    IReadOnlyList<ResumenCategoriaDto> PorCategoria);

public record ResumenCategoriaDto(
    Guid CategoriaId,
    string CategoriaNombre,
    string Tipo,
    decimal Total,
    int CantidadMovimientos);
