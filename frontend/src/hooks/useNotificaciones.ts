import { useCallback, useEffect, useState } from "react";
import { notificaciones } from "../api/finanzas";

export type EstadoNotificaciones =
  // El navegador no sabe de notificaciones push (Safari de escritorio viejo,
  // o cualquier navegador dentro de una app embebida).
  | "sin-soporte"
  // El servidor no tiene claves VAPID cargadas: no hay nada que ofrecer.
  | "sin-configurar"
  // El usuario ya dijo que no. Hay que ir a los permisos del sitio a mano.
  | "bloqueado"
  | "apagado"
  | "encendido";

// Chrome exige `applicationServerKey` como bytes crudos, y la clave viaja en
// base64 de URL. Convertirla es puro tramite pero hay que hacerlo bien.
// El tipo de retorno se anota como Uint8Array<ArrayBuffer> y no como
// Uint8Array a secas porque TypeScript, desde que los arreglos tipados son
// genericos, no acepta uno que podria estar respaldado por memoria compartida.
function aBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const normalizado = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = normalizado.padEnd(
    normalizado.length + ((4 - (normalizado.length % 4)) % 4),
    "=",
  );
  const binario = atob(relleno);

  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

// Las claves de la suscripcion vienen como ArrayBuffer y el servidor las quiere
// en base64 de URL, que es como las escribe el estandar.
function aBase64Url(datos: ArrayBuffer | null): string {
  if (datos === null) return "";
  const binario = String.fromCharCode(...new Uint8Array(datos));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const soportado = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

// Maneja el recordatorio diario de este navegador: si esta activo, activarlo y
// apagarlo. La suscripcion es por navegador, no por usuario: cada dispositivo
// donde se acepte recibe su propio aviso.
export function useNotificaciones() {
  // El soporte del navegador se sabe sin preguntarle a nadie, asi que arranca
  // resuelto en vez de pasar por un estado intermedio que no es cierto.
  const [estado, setEstado] = useState<EstadoNotificaciones>(() =>
    soportado() ? "apagado" : "sin-soporte",
  );
  const [cargando, setCargando] = useState(soportado);
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Al montar mira en que situacion esta todo: claves en el servidor, permiso
  // del usuario y si este navegador ya esta suscripto. Va adentro del efecto y
  // no en una funcion aparte porque no se vuelve a llamar desde ningun lado.
  useEffect(() => {
    if (!soportado()) return;

    // Entre el pedido a la Api y la respuesta el usuario puede haberse ido de
    // Ajustes; sin esta bandera se estaria escribiendo en un componente muerto.
    let vigente = true;

    void (async () => {
      try {
        const { habilitado } = await notificaciones.configuracion();
        if (!vigente) return;

        if (!habilitado) {
          setEstado("sin-configurar");
          return;
        }

        if (Notification.permission === "denied") {
          setEstado("bloqueado");
          return;
        }

        const registro = await navigator.serviceWorker.ready;
        const suscripcion = await registro.pushManager.getSubscription();

        if (suscripcion === null) {
          if (vigente) setEstado("apagado");
          return;
        }

        // Puede pasar que el navegador tenga la suscripcion y el servidor no
        // (se restauro la base, se limpiaron las filas). Ahi el interruptor
        // tiene que mostrarse apagado, que es la verdad.
        const { suscripto } = await notificaciones.estado(suscripcion.endpoint);
        if (vigente) setEstado(suscripto ? "encendido" : "apagado");
      } catch {
        if (vigente) setEstado("apagado");
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, []);

  const encender = useCallback(async () => {
    setTrabajando(true);
    setMensaje(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "apagado");
        return;
      }

      const { clavePublica } = await notificaciones.configuracion();
      const registro = await navigator.serviceWorker.ready;

      // `userVisibleOnly` es obligatorio en Chrome: es el compromiso de que
      // todo push termina en una notificacion visible y no en algo silencioso.
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: aBytes(clavePublica),
      });

      await notificaciones.suscribir({
        endpoint: suscripcion.endpoint,
        claveP256dh: aBase64Url(suscripcion.getKey("p256dh")),
        claveAuth: aBase64Url(suscripcion.getKey("auth")),
        dispositivo: navigator.userAgent,
      });

      setEstado("encendido");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo activar el recordatorio.");
    } finally {
      setTrabajando(false);
    }
  }, []);

  const apagar = useCallback(async () => {
    setTrabajando(true);
    setMensaje(null);
    try {
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();

      if (suscripcion !== null) {
        // Primero se avisa al servidor y despues se cancela local: al reves, si
        // falla la llamada, queda una fila que ya no le sirve a nadie.
        await notificaciones.darDeBaja(suscripcion.endpoint);
        await suscripcion.unsubscribe();
      }

      setEstado("apagado");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo apagar el recordatorio.");
    } finally {
      setTrabajando(false);
    }
  }, []);

  // Manda el aviso ahora. Es la unica forma honesta de saber si el permiso, la
  // suscripcion y las claves del servidor estan bien: que llegue.
  const probar = useCallback(async () => {
    setTrabajando(true);
    setMensaje(null);
    try {
      const resultado = await notificaciones.probar();
      setMensaje(
        resultado.enviadas > 0
          ? "Listo, tendría que llegarte en un momento."
          : resultado.motivo,
      );
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo mandar la prueba.");
    } finally {
      setTrabajando(false);
    }
  }, []);

  return { estado, cargando, trabajando, mensaje, encender, apagar, probar };
}
