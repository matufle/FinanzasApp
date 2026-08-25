namespace FinanzasApp.Api.Autenticacion;

// Todo lo que hace falta para el login, en un solo lugar. Se llena desde
// appsettings o, mejor, desde user-secrets en desarrollo y variables de
// entorno en produccion: ninguno de estos valores va al repositorio.
public sealed class OpcionesAutenticacion
{
    public const string Seccion = "Autenticacion";

    // El "Client ID" que da Google Cloud Console. No es secreto (viaja al
    // navegador), pero la Api lo necesita para verificar que el token que le
    // mandan fue emitido para esta aplicacion y no para otra cualquiera.
    public string GoogleClientId { get; set; } = string.Empty;

    // Qwak es de una sola persona: cualquier cuenta de Google que no este en
    // esta lista se rechaza aunque haya iniciado sesion en Google sin problemas.
    public string[] EmailsPermitidos { get; set; } = [];

    // Clave simetrica con la que se firma el token propio de la app.
    // Tiene que tener al menos 32 caracteres (HMAC-SHA256).
    public string ClaveFirma { get; set; } = string.Empty;

    // Cuanto dura la sesion. Larga a proposito: la app se usa desde el celular
    // y volver a loguearse todos los dias es exactamente lo que hace que una
    // app de finanzas se abandone.
    public int DiasDeSesion { get; set; } = 30;

    public bool TieneGoogleConfigurado => !string.IsNullOrWhiteSpace(GoogleClientId);
}
