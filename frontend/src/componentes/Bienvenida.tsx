import { useCallback, useEffect, useRef, useState } from "react";

// Cortina de bienvenida: tapa la app con el logo animado mientras React monta
// y las primeras pantallas piden sus datos, igual que hacen Mercado Pago o el
// homebanking. Dura lo que dura el video (menos de tres segundos) y se puede
// saltear tocando la pantalla.
//
// El video es `public/intro.mp4`: el logo recortado sobre el mismo color de
// fondo de la app (`--color-background`), sin audio y sin transparencia, para
// que no haga falta ningun truco de composicion en el navegador y funcione
// igual en iOS, Android y escritorio.

// Si en este tiempo el video todavia no empezo a reproducirse, se lo da por
// perdido y se abre la app igual. Pasa cuando el navegador bloquea el
// autoplay, cuando el archivo no esta o cuando la red esta muy lenta.
const ESPERA_MAXIMA = 2500;

// Tope de seguridad una vez que arranco, por si el evento `ended` no llega.
const REPRODUCCION_MAXIMA = 6000;

// Tiene que coincidir con la duracion del fundido de salida en las clases.
const FUNDIDO_SALIDA = 450;

export function Bienvenida({ alTerminar }: { alTerminar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [arranco, setArranco] = useState(false);

  const cerrar = useCallback(() => setSaliendo(true), []);

  // El desmontaje va despues del fundido, no en el mismo momento: si no, la
  // cortina desaparece de golpe y se ve el salto a la pantalla de abajo.
  useEffect(() => {
    if (!saliendo) return;
    const temporizador = setTimeout(alTerminar, FUNDIDO_SALIDA);
    return () => clearTimeout(temporizador);
  }, [saliendo, alTerminar]);

  // Red de seguridad: la cortina nunca puede quedarse trabada tapando la app.
  useEffect(() => {
    const temporizador = setTimeout(cerrar, arranco ? REPRODUCCION_MAXIMA : ESPERA_MAXIMA);
    return () => clearTimeout(temporizador);
  }, [arranco, cerrar]);

  // Chrome y Safari ignoran el atributo `autoPlay` en algunas situaciones
  // (pestaña en segundo plano, ahorro de energia), asi que se pide la
  // reproduccion a mano y, si la rechazan, se sigue de largo.
  useEffect(() => {
    video.current?.play().catch((error: unknown) => {
      // AbortError no es un fallo real: aparece cuando React remonta el efecto
      // en modo estricto y el pedido anterior queda a medio camino.
      if (error instanceof DOMException && error.name === "AbortError") return;
      cerrar();
    });
  }, [cerrar]);

  return (
    <div
      onClick={cerrar}
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-[450ms] ease-out ${
        saliendo ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={video}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onPlaying={() => setArranco(true)}
        onEnded={cerrar}
        onError={cerrar}
        className="w-[58vw] max-w-[240px]"
      />
    </div>
  );
}
