// Registro del service worker: es lo que convierte a Qwak en una app
// instalable (icono propio, sin barra de direcciones) en vez de una pestaña.
//
// Se registra tambien en desarrollo —Vite sirve `public/` igual y el navegador
// acepta service workers en `localhost` sin HTTPS—, asi el boton de "Instalar"
// de Ajustes se puede probar sin subir nada.
export function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // Despues de `load` para no pelear ancho de banda con el arranque de la app.
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      // Que falle no rompe nada: la app sigue andando como pagina normal.
      console.warn("No se pudo registrar el service worker.", error);
    });
  });
}
