// Service worker de Qwak.
//
// Existe por dos motivos y ninguno es cachear:
//
// 1. Para que el navegador ofrezca instalar la app hace falta un service worker
//    registrado con un manejador de `fetch`. El de acá no hace nada: deja pasar
//    todos los pedidos a la red tal cual.
// 2. Es el unico lugar donde pueden llegar las notificaciones push cuando la
//    app esta cerrada (fase 5 del roadmap).
//
// Funcionar sin internet es otro tema —hay que decidir que datos se muestran y
// como se sincronizan despues— y esta anotado aparte en el roadmap. Mientras
// tanto, un service worker que no cachea nada nunca sirve una version vieja.

// Sin `skipWaiting` la version nueva se queda esperando a que se cierren todas
// las pestañas. Como no hay estado que migrar, conviene que entre de una.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (evento) => evento.waitUntil(self.clients.claim()));

// A proposito vacio: alcanza con que exista para que la app sea instalable.
self.addEventListener("fetch", () => {});

// --- Notificaciones ---------------------------------------------------------

// Los avisos llegan sin contenido: el servidor manda un POST vacio y el texto
// lo pone este archivo. Se hace asi porque un aviso con datos adentro hay que
// cifrarlo, y como el recordatorio es siempre el mismo no hace falta.
const RECORDATORIO = {
  titulo: "¿Anotaste lo de hoy?",
  cuerpo: "Todavía no cargaste ningún movimiento. Son treinta segundos.",
  destino: "/movimientos/nuevo",
};

self.addEventListener("push", (evento) => {
  evento.waitUntil(
    self.registration.showNotification(RECORDATORIO.titulo, {
      body: RECORDATORIO.cuerpo,
      icon: "/icono-192.png",
      badge: "/icono-192.png",
      lang: "es-AR",
      // Con la misma etiqueta, un aviso nuevo reemplaza al anterior en vez de
      // apilarse: nadie quiere despertarse con cinco recordatorios iguales.
      tag: "qwak-recordatorio",
      data: { url: RECORDATORIO.destino },
    }),
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = evento.notification.data?.url ?? "/";

  // Si la app ya esta abierta se la trae al frente y se la lleva a la pantalla
  // de cargar; abrir una ventana nueva dejaria dos copias dando vueltas.
  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const ventana of ventanas) {
        if (new URL(ventana.url).origin !== self.location.origin) continue;

        await ventana.focus();
        try {
          await ventana.navigate(destino);
        } catch {
          // Algunos navegadores no dejan navegar una ventana que no controlan.
          // Quedarse en la pantalla que estaba abierta es mejor que no hacer nada.
        }
        return;
      }

      await self.clients.openWindow(destino);
    })(),
  );
});
