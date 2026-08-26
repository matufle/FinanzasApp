namespace FinanzasApp.Infrastructure.Notificaciones;

// Configuracion de las notificaciones. Va por variables de entorno con el
// prefijo 'Push__' (por ejemplo Push__ClavePrivada), nunca en el repositorio.
public sealed class OpcionesPush
{
    public const string Seccion = "Push";

    // Par de claves VAPID: identifican a este servidor ante Google, Mozilla y
    // Apple, que son quienes entregan las notificaciones. La publica ademas
    // viaja al navegador, que la usa para crear la suscripcion; si cambia, todas
    // las suscripciones existentes dejan de servir.
    public string ClavePublica { get; set; } = string.Empty;
    public string ClavePrivada { get; set; } = string.Empty;

    // Contacto del responsable, que el estandar pide para poder avisar si algo
    // anda mal con los envios. Nadie lo valida, pero conviene poner uno real.
    //
    // El valor de abajo es un marcador a proposito: el mail de verdad va por
    // configuracion, no en el codigo, porque el repositorio es publico.
    public string Contacto { get; set; } = "mailto:qwak@ejemplo.com";

    // Clave compartida con el programador de tareas que llama al recordatorio.
    // Ese endpoint no puede pedir sesion de usuario —lo llama una maquina— asi
    // que lo que lo protege es este secreto en una cabecera.
    public string ClaveRecordatorio { get; set; } = string.Empty;

    // Diferencia horaria contra UTC para saber cuando empieza y termina "hoy".
    //
    // Se configura como numero y no con TimeZoneInfo a proposito: las imagenes
    // chicas de .NET no siempre traen la base de zonas horarias, y Argentina no
    // usa horario de verano desde 2009, asi que un desfasaje fijo es exacto.
    public double DesfasajeHoras { get; set; } = -3;

    public bool Configurado =>
        !string.IsNullOrWhiteSpace(ClavePublica) && !string.IsNullOrWhiteSpace(ClavePrivada);
}
