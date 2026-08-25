using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Servicios;

public class ServicioCategoria
{
    private readonly IRepositorioCategoria _repositorio;

    public ServicioCategoria(IRepositorioCategoria repositorio)
    {
        _repositorio = repositorio;
    }

    public async Task<CategoriaDto> CrearAsync(CrearCategoriaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new ReglaDeNegocioException("La categoria necesita un nombre.");

        if (!Enum.TryParse<TipoMovimiento>(request.Tipo, ignoreCase: true, out var tipo))
            throw new ReglaDeNegocioException("El tipo debe ser 'Ingreso' o 'Egreso'.");

        var categoria = new Categoria
        {
            Nombre = request.Nombre.Trim(),
            Tipo = tipo
        };

        await _repositorio.AgregarAsync(categoria);

        return Mapear(categoria);
    }

    public async Task<IReadOnlyList<CategoriaDto>> ObtenerTodasAsync(string? tipo = null)
    {
        if (!string.IsNullOrWhiteSpace(tipo))
        {
            if (!Enum.TryParse<TipoMovimiento>(tipo, ignoreCase: true, out var tipoEnum))
                throw new ReglaDeNegocioException("El tipo debe ser 'Ingreso' o 'Egreso'.");

            var filtradas = await _repositorio.ObtenerPorTipoAsync(tipoEnum);
            return filtradas.Select(Mapear).ToList();
        }

        var todas = await _repositorio.ObtenerTodasAsync();
        return todas.Select(Mapear).ToList();
    }

    public async Task DarDeBajaAsync(Guid id)
    {
        var categoria = await _repositorio.ObtenerPorIdAsync(id)
            ?? throw new NoEncontradoException($"No existe la categoria {id}.");

        categoria.Estado = EstadoRegistro.Inactivo;
        await _repositorio.ActualizarAsync(categoria);
    }

    private static CategoriaDto Mapear(Categoria c) =>
        new(c.Id, c.Nombre, c.Tipo.ToString(), c.Estado.ToString());
}
