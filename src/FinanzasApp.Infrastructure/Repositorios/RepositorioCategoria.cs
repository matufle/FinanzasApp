using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;
using FinanzasApp.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace FinanzasApp.Infrastructure.Repositorios;

public class RepositorioCategoria : IRepositorioCategoria
{
    private readonly FinanzasDbContext _contexto;

    public RepositorioCategoria(FinanzasDbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<Categoria?> ObtenerPorIdAsync(Guid id) =>
        await _contexto.Categorias.FirstOrDefaultAsync(c => c.Id == id);

    public async Task<IReadOnlyList<Categoria>> ObtenerTodasAsync(bool soloActivas = true)
    {
        var consulta = _contexto.Categorias.AsQueryable();

        if (soloActivas)
            consulta = consulta.Where(c => c.Estado == EstadoRegistro.Activo);

        return await consulta.OrderBy(c => c.Nombre).ToListAsync();
    }

    public async Task<IReadOnlyList<Categoria>> ObtenerPorTipoAsync(TipoMovimiento tipo) =>
        await _contexto.Categorias
            .Where(c => c.Estado == EstadoRegistro.Activo && c.Tipo == tipo)
            .OrderBy(c => c.Nombre)
            .ToListAsync();

    public async Task AgregarAsync(Categoria categoria)
    {
        _contexto.Categorias.Add(categoria);
        await _contexto.SaveChangesAsync();
    }

    public async Task ActualizarAsync(Categoria categoria)
    {
        _contexto.Categorias.Update(categoria);
        await _contexto.SaveChangesAsync();
    }
}
