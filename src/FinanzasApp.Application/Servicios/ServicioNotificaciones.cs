using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;

namespace FinanzasApp.Application.Servicios;

// Notificaciones push: alta y baja de suscripciones, y el recordatorio diario.
//
// El recordatorio no lo dispara este servicio a horario fijo: la Api corre en
// Cloud Run, que apaga el contenedor cuando no hay pedidos, asi que un timer
// adentro del proceso no correria de noche. Quien lo llama es un programador
// de tareas externo (Cloud Scheduler) que pega en el endpoint a la hora que se
// le configuro. Aca solo esta la decision de si corresponde avisar.
public class ServicioNotificaciones
{
    private readonly IRepositorioSuscripcionPush _suscripciones;
    private readonly IRepositorioMovimiento _movimientos;
    private readonly IEnviadorPush _enviador;

    public ServicioNotificaciones(
        IRepositorioSuscripcionPush suscripciones,
        IRepositorioMovimiento movimientos,
        IEnviadorPush enviador)
    {
        _suscripciones = suscripciones;
        _movimientos = movimientos;
        _enviador = enviador;
    }

    public bool Configurado => _enviador.Configurado;
    public string ClavePublica => _enviador.ClavePublica;

    // Alta idempotente: el navegador manda el mismo endpoint cada vez que se
    // suscribe, asi que si ya existe se actualiza en vez de duplicar la fila.
    public async Task RegistrarAsync(SuscripcionPushRequest peticion)
    {
        if (string.IsNullOrWhiteSpace(peticion.Endpoint))
            throw new ReglaDeNegocioException("La suscripcion no trae endpoint.");

        var existente = await _suscripciones.ObtenerPorEndpointAsync(peticion.Endpoint);
        var dispositivo = Recortar(peticion.Dispositivo, 200);

        if (existente is not null)
        {
            existente.ClaveP256dh = peticion.ClaveP256dh;
            existente.ClaveAuth = peticion.ClaveAuth;
            existente.Dispositivo = dispositivo;
            await _suscripciones.ActualizarAsync(existente);
            return;
        }

        await _suscripciones.AgregarAsync(new SuscripcionPush
        {
            Endpoint = peticion.Endpoint,
            ClaveP256dh = peticion.ClaveP256dh,
            ClaveAuth = peticion.ClaveAuth,
            Dispositivo = dispositivo
        });
    }

    // Dar de baja algo que ya no esta no es un error: el navegador puede pedir
    // la baja dos veces, o de una suscripcion que la Api ya limpio sola.
    public async Task DarDeBajaAsync(string endpoint)
    {
        var suscripcion = await _suscripciones.ObtenerPorEndpointAsync(endpoint);
        if (suscripcion is null) return;

        await _suscripciones.EliminarAsync(suscripcion);
    }

    public async Task<bool> EstaSuscriptoAsync(string endpoint) =>
        await _suscripciones.ObtenerPorEndpointAsync(endpoint) is not null;

    // El recordatorio de la noche: si en todo el dia no se cargo ningun
    // movimiento, avisa; si se cargo aunque sea uno, no molesta.
    //
    // Mira la fecha de alta y no la fecha del movimiento a proposito. La
    // pregunta es "¿anotaste algo hoy?", asi que cargar hoy el gasto de ayer
    // cuenta como que ya lo hiciste.
    public async Task<EnvioDto> EnviarRecordatorioDiarioAsync(
        DateTime inicioDelDiaUtc,
        DateTime finDelDiaUtc,
        CancellationToken cancelacion = default)
    {
        if (await _movimientos.HuboAltasEntreAsync(inicioDelDiaUtc, finDelDiaUtc))
            return new EnvioDto(true, "Ya se cargaron movimientos hoy.", 0, 0, 0);

        return await EnviarATodasAsync(cancelacion);
    }

    // Manda el mismo aviso sin fijarse en nada. Es el boton de "probar" de
    // Ajustes: la unica forma honesta de saber si el permiso, la suscripcion y
    // las claves del servidor estan bien es que llegue una notificacion.
    public Task<EnvioDto> EnviarPruebaAsync(CancellationToken cancelacion = default) =>
        EnviarATodasAsync(cancelacion);

    private async Task<EnvioDto> EnviarATodasAsync(CancellationToken cancelacion)
    {
        if (!_enviador.Configurado)
            throw new ReglaDeNegocioException("Las notificaciones no estan configuradas en el servidor.");

        var suscripciones = await _suscripciones.ObtenerTodasAsync();
        if (suscripciones.Count == 0)
            return new EnvioDto(true, "No hay ningun dispositivo suscripto.", 0, 0, 0);

        int enviadas = 0, vencidas = 0, fallidas = 0;

        foreach (var suscripcion in suscripciones)
        {
            switch (await _enviador.EnviarAsync(suscripcion, cancelacion))
            {
                case ResultadoPush.Entregado:
                    enviadas++;
                    suscripcion.UltimoEnvio = DateTime.UtcNow;
                    await _suscripciones.ActualizarAsync(suscripcion);
                    break;

                // El navegador ya no existe del otro lado: la fila solo puede
                // seguir fallando, asi que se borra.
                case ResultadoPush.SuscripcionVencida:
                    vencidas++;
                    await _suscripciones.EliminarAsync(suscripcion);
                    break;

                default:
                    fallidas++;
                    break;
            }
        }

        return new EnvioDto(false, "Aviso enviado.", enviadas, vencidas, fallidas);
    }

    private static string Recortar(string? valor, int largo) =>
        string.IsNullOrWhiteSpace(valor)
            ? "Dispositivo desconocido"
            : valor.Length <= largo ? valor : valor[..largo];
}
