import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Inicio } from "./paginas/Inicio";

// Cada pantalla que traigas de Stitch se agrega como una <Route> mas.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  );
}
