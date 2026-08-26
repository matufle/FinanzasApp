namespace FinanzasApp.Application.Dtos;

// Lo que manda el navegador cuando el usuario acepta recibir avisos. Sale tal
// cual de `PushSubscription.toJSON()`, mas el nombre del dispositivo.
public record SuscripcionPushRequest(
    string Endpoint,
    string ClaveP256dh,
    string ClaveAuth,
    string Dispositivo);

// Como termino una tanda de avisos. `Salteado` en true significa que no habia
// nada que avisar: el recordatorio del dia no hacia falta.
public record EnvioDto(
    bool Salteado,
    string Motivo,
    int Enviadas,
    int Vencidas,
    int Fallidas);
