import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProveedorSesion, RutaProtegida } from "./auth/sesion";
import { Bienvenida } from "./componentes/Bienvenida";
import { Login } from "./paginas/Login";
import { Inicio } from "./paginas/Inicio";
import { Categorias } from "./paginas/Categorias";
import { Cuentas } from "./paginas/Cuentas";
import { NuevoMovimiento } from "./paginas/NuevoMovimiento";
import { Movimientos } from "./paginas/Movimientos";
import { Metricas } from "./paginas/Metricas";
import { Ajustes } from "./paginas/Ajustes";

// /login es la unica ruta publica. El resto pasa por RutaProtegida,
// que rebota al login si no hay sesion guardada.
export default function App() {
  // La cortina de bienvenida se dibuja por encima de todo, no en lugar de la
  // app: asi las pantallas montan y piden sus datos mientras corre el video, y
  // cuando se levanta ya hay algo abajo. La excepcion es quien pidio "reducir
  // movimiento" en su sistema: para ese la app arranca directo.
  const [bienvenida, setBienvenida] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  return (
    <ProveedorSesion>
      {bienvenida && <Bienvenida alTerminar={() => setBienvenida(false)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Inicio />
              </RutaProtegida>
            }
          />
          <Route
            path="/categorias"
            element={
              <RutaProtegida>
                <Categorias />
              </RutaProtegida>
            }
          />
          <Route
            path="/metricas"
            element={
              <RutaProtegida>
                <Metricas />
              </RutaProtegida>
            }
          />
          <Route
            path="/cuentas"
            element={
              <RutaProtegida>
                <Cuentas />
              </RutaProtegida>
            }
          />
          <Route
            path="/movimientos"
            element={
              <RutaProtegida>
                <Movimientos />
              </RutaProtegida>
            }
          />
          <Route
            path="/movimientos/nuevo"
            element={
              <RutaProtegida>
                <NuevoMovimiento />
              </RutaProtegida>
            }
          />
          <Route
            path="/ajustes"
            element={
              <RutaProtegida>
                <Ajustes />
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </ProveedorSesion>
  );
}
