using FinanzasApp.Domain.Common;

namespace FinanzasApp.Domain.Entities;

// Un navegador que acepto recibir notificaciones. No es un usuario: la misma
// persona genera una suscripcion por cada navegador y dispositivo donde diga
// que si, y cada una tiene su propia direccion de entrega.
//
// El Endpoint es una URL del servicio push del navegador (Google, Mozilla o
// Apple, segun cual sea). Mandar una notificacion es hacerle un POST firmado.
public class SuscripcionPush : EntidadBase
{
    public string Endpoint { get; set; } = string.Empty;

    // Claves con las que se cifra el contenido de la notificacion. Hoy Qwak
    // manda avisos sin contenido —el texto lo pone el service worker, porque
    // siempre es el mismo recordatorio— asi que no se usan. Se guardan igual
    // para que el dia que haya avisos con datos adentro no haya que migrar la
    // tabla ni pedirle a nadie que se vuelva a suscribir.
    public string ClaveP256dh { get; set; } = string.Empty;
    public string ClaveAuth { get; set; } = string.Empty;

    // Para poder distinguir "la compu" de "el celular" en pantalla.
    public string Dispositivo { get; set; } = string.Empty;

    // Ultima vez que el servicio push acepto una entrega. Sirve para ver de un
    // vistazo si una suscripcion sigue viva.
    public DateTime? UltimoEnvio { get; set; }
}
