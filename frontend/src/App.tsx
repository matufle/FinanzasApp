import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProveedorSesion, RutaProtegida } from "./auth/sesion";
import { Login } from "./paginas/Login";
import { Inicio } from "./paginas/Inicio";
import { Categorias } from "./paginas/Categorias";
import { Cuentas } from "./paginas/Cuentas";
import { NuevoMovimiento } from "./paginas/NuevoMovimiento";
import { Movimientos } from "./paginas/Movimientos";
import { Ajustes } from "./paginas/Ajustes";

// /login es la unica ruta publica. El resto pasa por RutaProtegida,
// que rebota al login si no hay sesion guardada.
export default function App() {
  return (
    <ProveedorSesion>
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
