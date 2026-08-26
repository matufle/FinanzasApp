using FinanzasApp.Domain.Entities;

namespace FinanzasApp.Application.Interfaces;

// Que le paso a una entrega. Interesa distinguir el caso "la suscripcion ya no
// existe" porque es el unico que obliga a borrar la fila: el navegador se
// desinstalo, se limpiaron los datos del sitio o el usuario dijo que no.
public enum ResultadoPush
{
    Entregado,
    SuscripcionVencida,
    Fallo
}

// Puerta de salida hacia el servicio push del navegador. Application decide
// cuando avisar; como se firma y se manda es problema de Infrastructure.
public interface IEnviadorPush
{
    bool Configurado { get; }
    string ClavePublica { get; }
    Task<ResultadoPush> EnviarAsync(SuscripcionPush suscripcion, CancellationToken cancelacion = default);
}
