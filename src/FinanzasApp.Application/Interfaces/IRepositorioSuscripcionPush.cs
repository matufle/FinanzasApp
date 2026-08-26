using FinanzasApp.Domain.Entities;

namespace FinanzasApp.Application.Interfaces;

// Contrato de persistencia para las suscripciones a notificaciones.
// El Endpoint es la identidad real de una suscripcion: el navegador lo repite
// tal cual si se vuelve a suscribir, asi que se busca por ahi y no por Id.
public interface IRepositorioSuscripcionPush
{
    Task<IReadOnlyList<SuscripcionPush>> ObtenerTodasAsync();
    Task<SuscripcionPush?> ObtenerPorEndpointAsync(string endpoint);
    Task AgregarAsync(SuscripcionPush suscripcion);
    Task ActualizarAsync(SuscripcionPush suscripcion);
    Task EliminarAsync(SuscripcionPush suscripcion);
}
