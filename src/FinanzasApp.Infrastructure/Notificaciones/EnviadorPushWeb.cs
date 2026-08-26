using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinanzasApp.Infrastructure.Notificaciones;

// Manda notificaciones push segun el estandar de la Web Push API, sin ninguna
// libreria de por medio.
//
// Se puede hacer a mano porque Qwak manda avisos *sin contenido*: el texto lo
// pone el service worker, que siempre muestra el mismo recordatorio. Un aviso
// con contenido obliga a cifrarlo (ECDH mas AES128-GCM, unas doscientas lineas
// de criptografia delicada); uno sin contenido es un POST vacio con una
// cabecera firmada, que es lo que hay aca abajo.
//
// La firma es VAPID: un JWT con la direccion del servicio push como audiencia,
// firmado con ECDSA P-256. Con eso Google o Mozilla saben que el pedido lo
// mando este servidor y no cualquiera que haya visto el endpoint.
public class EnviadorPushWeb : IEnviadorPush
{
    // Cuanto guarda el servicio push el aviso si el dispositivo esta apagado.
    private const int TtlSegundos = 12 * 60 * 60;

    // El estandar permite hasta 24 horas de validez para el token.
    private static readonly TimeSpan DuracionToken = TimeSpan.FromHours(12);

    private readonly HttpClient _http;
    private readonly OpcionesPush _opciones;
    private readonly ILogger<EnviadorPushWeb> _log;

    public EnviadorPushWeb(HttpClient http, IOptions<OpcionesPush> opciones, ILogger<EnviadorPushWeb> log)
    {
        _http = http;
        _opciones = opciones.Value;
        _log = log;
    }

    public bool Configurado => _opciones.Configurado;
    public string ClavePublica => _opciones.ClavePublica;

    public async Task<ResultadoPush> EnviarAsync(
        SuscripcionPush suscripcion, CancellationToken cancelacion = default)
    {
        if (!Configurado)
        {
            _log.LogWarning("Se intento mandar una notificacion sin claves VAPID configuradas.");
            return ResultadoPush.Fallo;
        }

        try
        {
            var pedido = new HttpRequestMessage(HttpMethod.Post, suscripcion.Endpoint)
            {
                // Sin cuerpo: el aviso no lleva datos. Igual hay que mandar
                // Content-Length: 0, que es lo que hace un contenido vacio.
                Content = new ByteArrayContent([])
            };

            pedido.Headers.TryAddWithoutValidation("Authorization", ArmarAutorizacion(suscripcion.Endpoint));
            pedido.Headers.TryAddWithoutValidation("TTL", TtlSegundos.ToString());
            // 'normal' deja que el celular junte el aviso con el proximo
            // despertar de la radio en vez de encenderla solo para esto.
            pedido.Headers.TryAddWithoutValidation("Urgency", "normal");

            var respuesta = await _http.SendAsync(pedido, cancelacion);

            if (respuesta.IsSuccessStatusCode)
                return ResultadoPush.Entregado;

            // 404 y 410 son la forma que tiene el servicio push de decir que esa
            // suscripcion ya no existe. Cualquier otro error puede ser pasajero.
            if (respuesta.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                _log.LogInformation("Suscripcion vencida, se da de baja: {Dispositivo}", suscripcion.Dispositivo);
                return ResultadoPush.SuscripcionVencida;
            }

            var detalle = await respuesta.Content.ReadAsStringAsync(cancelacion);
            _log.LogWarning("El servicio push contesto {Codigo}: {Detalle}", (int)respuesta.StatusCode, detalle);
            return ResultadoPush.Fallo;
        }
        catch (Exception error) when (error is HttpRequestException or TaskCanceledException)
        {
            _log.LogWarning(error, "No se pudo contactar al servicio push.");
            return ResultadoPush.Fallo;
        }
    }

    // Cabecera 'Authorization: vapid t=<jwt>, k=<clave publica>'.
    private string ArmarAutorizacion(string endpoint)
    {
        var destino = new Uri(endpoint);
        var token = FirmarToken($"{destino.Scheme}://{destino.Authority}");
        return $"vapid t={token}, k={_opciones.ClavePublica}";
    }

    private string FirmarToken(string audiencia)
    {
        var cabecera = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new { typ = "JWT", alg = "ES256" }));
        var cuerpo = Base64Url(JsonSerializer.SerializeToUtf8Bytes(new
        {
            aud = audiencia,
            exp = DateTimeOffset.UtcNow.Add(DuracionToken).ToUnixTimeSeconds(),
            sub = _opciones.Contacto
        }));

        var firmado = $"{cabecera}.{cuerpo}";

        using var ecdsa = ECDsa.Create();
        ecdsa.ImportParameters(new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256,
            D = DesdeBase64Url(_opciones.ClavePrivada),
            // La clave publica VAPID viene en formato "sin comprimir": un 0x04
            // adelante y despues las coordenadas X e Y, 32 bytes cada una.
            Q = PuntoDeClavePublica(_opciones.ClavePublica)
        });

        // ES256 quiere la firma como R y S pegados, no envuelta en DER, que es
        // lo que .NET devuelve por defecto.
        var firma = ecdsa.SignData(
            Encoding.ASCII.GetBytes(firmado),
            HashAlgorithmName.SHA256,
            DSASignatureFormat.IeeeP1363FixedFieldConcatenation);

        return $"{firmado}.{Base64Url(firma)}";
    }

    private static ECPoint PuntoDeClavePublica(string clavePublica)
    {
        var bytes = DesdeBase64Url(clavePublica);

        if (bytes.Length != 65 || bytes[0] != 0x04)
            throw new InvalidOperationException(
                "La clave publica VAPID tiene que ser un punto sin comprimir de 65 bytes en base64url.");

        return new ECPoint { X = bytes[1..33], Y = bytes[33..65] };
    }

    // Base64 de URL: sin relleno y con - y _ en vez de + y /.
    private static string Base64Url(byte[] datos) =>
        Convert.ToBase64String(datos).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] DesdeBase64Url(string texto)
    {
        var normalizado = texto.Replace('-', '+').Replace('_', '/');
        return Convert.FromBase64String(normalizado.PadRight(
            normalizado.Length + (4 - normalizado.Length % 4) % 4, '='));
    }
}
