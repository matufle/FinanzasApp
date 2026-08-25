import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { autenticacion } from "../api/finanzas";
import type { RespuestaSesion } from "../api/token";
import { CLIENT_ID, GOOGLE_CONFIGURADO, cargarGoogle } from "../auth/google";
import { useSesion } from "../auth/contexto";
import { Logo } from "../componentes/Logo";

// Pantalla de entrada. Es la unica ruta publica: todo lo demas exige sesion.
//
// El flujo completo son tres pasos: Google identifica al usuario en su propio
// popup y devuelve un ID token firmado, ese token se le manda a la Api, y la
// Api contesta con el token de Qwak que se guarda para todos los pedidos.
export function Login() {
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  // Si el usuario llego rebotado desde una pantalla protegida, se lo devuelve
  // ahi despues de entrar en vez de mandarlo siempre al inicio.
  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? "/";

  const entrar = useCallback(
    async (pedirSesion: () => Promise<RespuestaSesion>) => {
      setEntrando(true);
      setError(null);
      try {
        const sesion = await pedirSesion();
        iniciarSesion(sesion.token, sesion.usuario);
        navegar(destino, { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo iniciar sesion.");
        setEntrando(false);
      }
    },
    [iniciarSesion, navegar, destino],
  );

  const conGoogle = useCallback(
    (credencial: string) => void entrar(() => autenticacion.conGoogle(credencial)),
    [entrar],
  );

  const conDesarrollo = useCallback(() => void entrar(() => autenticacion.desarrollo()), [entrar]);

  const alFallarGoogle = useCallback((mensaje: string) => setError(mensaje), []);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-background selection:bg-surface-variant">
      {/*
        Esta pantalla no lleva barra superior ni navegacion inferior a proposito:
        es un paso lineal y todo lo que no sea "entrar" distrae.
      */}
      <main className="flex w-full flex-1 flex-col items-center justify-center px-container-margin">
        {/* Marca */}
        <div className="mb-[80px] flex w-full flex-col items-center text-center">
          <div className="mb-stack-gap-lg">
            <Logo className="h-24 w-24" />
          </div>
          <h1 className="mb-stack-gap-sm font-headline-lg text-headline-lg tracking-tight text-primary">
            Qwak
          </h1>
          <p className="max-w-[280px] font-body-md text-body-md text-on-surface-variant">
            Tus finanzas, simplificadas.
          </p>
        </div>

        {/* Accion de autenticacion */}
        <div className="mx-auto flex w-full max-w-xs flex-col gap-stack-gap-md">
          {entrando ? (
            <p
              role="status"
              className="text-center font-body-md text-body-md text-on-surface-variant"
            >
              Entrando...
            </p>
          ) : GOOGLE_CONFIGURADO ? (
            <BotonGoogle alEntrar={conGoogle} alFallar={alFallarGoogle} />
          ) : (
            <BotonDesarrollo onClick={conDesarrollo} />
          )}

          {error !== null && (
            <p role="alert" className="text-center font-body-md text-body-md text-error">
              {error}
            </p>
          )}
        </div>
      </main>

      {/* Aviso legal, anclado al pie de la pantalla */}
      <div className="absolute bottom-8 left-0 w-full px-container-margin text-center">
        <p className="font-label-caps text-[10px] font-bold uppercase tracking-wider text-outline">
          Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </div>
    </div>
  );
}

// El boton lo dibuja Google, no nosotros: su libreria exige renderizarlo ella
// misma para poder abrir el popup de seleccion de cuenta. Se lo configura para
// que diga "Continuar con Google", que es lo que pedia el diseño.
function BotonGoogle({
  alEntrar,
  alFallar,
}: {
  alEntrar: (credencial: string) => void;
  alFallar: (mensaje: string) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  // La libreria de Google se queda con la funcion que le pasamos en
  // initialize(). Guardarla en un ref permite que siempre llame a la version
  // actual sin tener que reinicializar la libreria en cada render.
  const ultimoAlEntrar = useRef(alEntrar);
  useEffect(() => {
    ultimoAlEntrar.current = alEntrar;
  }, [alEntrar]);

  useEffect(() => {
    const destino = contenedor.current;
    if (destino === null) return;

    let vivo = true;

    cargarGoogle()
      .then((identidad) => {
        if (!vivo) return;

        identidad.initialize({
          client_id: CLIENT_ID,
          callback: (respuesta) => ultimoAlEntrar.current(respuesta.credential),
          // Entrar solo, sin tocar nada, es desconcertante la primera vez.
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // En desarrollo React monta los efectos dos veces; sin esto quedarian
        // dos botones de Google uno abajo del otro.
        destino.replaceChildren();

        identidad.renderButton(destino, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          locale: "es",
          // Google exige un ancho en pixeles y no acepta mas de 400.
          width: Math.min(Math.round(destino.getBoundingClientRect().width) || 320, 400),
        });
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        alFallar(e instanceof Error ? e.message : "No se pudo cargar el login de Google.");
      });

    return () => {
      vivo = false;
    };
  }, [alFallar]);

  return (
    <div
      ref={contenedor}
      className="flex w-full justify-center overflow-hidden rounded-md shadow-soft"
    />
  );
}

// Solo aparece cuando no hay VITE_GOOGLE_CLIENT_ID configurado, es decir en
// desarrollo. Del otro lado, la Api unicamente publica /api/auth/desarrollo
// cuando corre en Development, asi que esto no puede abrir nada en produccion.
function BotonDesarrollo({ onClick }: { onClick: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="flex h-14 w-full items-center justify-center gap-inline-gutter rounded-xl border border-outline-variant bg-surface-container-lowest shadow-soft transition-all duration-300 hover:shadow-floating active:scale-[0.98]"
      >
        <LogoGoogle />
        <span className="font-label-sm text-label-sm text-on-surface">
          Entrar en modo desarrollo
        </span>
      </button>
      <p className="text-center font-body-md text-body-md text-on-surface-variant">
        Falta configurar <code>VITE_GOOGLE_CLIENT_ID</code> para entrar con Google.
      </p>
    </>
  );
}

// La "G" de Google, embebida para no depender de una libreria de iconos.
function LogoGoogle() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}
