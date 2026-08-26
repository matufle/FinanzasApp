using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace FinanzasApp.Infrastructure.Repositorios;

public class RepositorioSuscripcionPush : IRepositorioSuscripcionPush
{
    private readonly FinanzasDbContext _contexto;

    public RepositorioSuscripcionPush(FinanzasDbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<IReadOnlyList<SuscripcionPush>> ObtenerTodasAsync() =>
        await _contexto.SuscripcionesPush.OrderBy(s => s.FechaCreacion).ToListAsync();

    public async Task<SuscripcionPush?> ObtenerPorEndpointAsync(string endpoint) =>
        await _contexto.SuscripcionesPush.FirstOrDefaultAsync(s => s.Endpoint == endpoint);

    public async Task AgregarAsync(SuscripcionPush suscripcion)
    {
        _contexto.SuscripcionesPush.Add(suscripcion);
        await _contexto.SaveChangesAsync();
    }

    public async Task ActualizarAsync(SuscripcionPush suscripcion)
    {
        _contexto.SuscripcionesPush.Update(suscripcion);
        await _contexto.SaveChangesAsync();
    }

    // Se borra de verdad, no se marca de baja como las cuentas o las categorias:
    // una suscripcion muerta no es historia que valga la pena conservar.
    public async Task EliminarAsync(SuscripcionPush suscripcion)
    {
        _contexto.SuscripcionesPush.Remove(suscripcion);
        await _contexto.SaveChangesAsync();
    }
}
