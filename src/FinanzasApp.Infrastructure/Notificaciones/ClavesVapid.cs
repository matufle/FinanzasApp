using System.Security.Cryptography;

namespace FinanzasApp.Infrastructure.Notificaciones;

// Generador del par de claves VAPID. Se usa una sola vez, cuando se pone en
// marcha el servidor: despues las claves van en variables de entorno y no se
// tocan mas. Si cambian, todos los navegadores suscriptos dejan de recibir
// avisos y tienen que volver a aceptarlos.
public static class ClavesVapid
{
    public record Par(string Publica, string Privada);

    public static Par Generar()
    {
        using var ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var parametros = ecdsa.ExportParameters(includePrivateParameters: true);

        // La clave publica viaja como punto sin comprimir: 0x04 y las dos
        // coordenadas de 32 bytes. Es el formato que espera el navegador en
        // `applicationServerKey`.
        var publica = new byte[65];
        publica[0] = 0x04;
        parametros.Q.X!.CopyTo(publica, 1);
        parametros.Q.Y!.CopyTo(publica, 33);

        return new Par(Base64Url(publica), Base64Url(parametros.D!));
    }

    private static string Base64Url(byte[] datos) =>
        Convert.ToBase64String(datos).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
