import { usePeticion } from "../hooks/usePeticion";
import { cuentas, reportes } from "../api/finanzas";

// Pantalla provisoria: sirve para comprobar que el frontend habla con la API.
// El diseño real lo reemplaza cuando este listo el de Stitch.
export function Inicio() {
  const listado = usePeticion(() => cuentas.listar(), []);
  const resumen = usePeticion(() => reportes.resumen(), []);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">FinanzasApp</h1>

      <section className="mb-8">
        <h2 className="mb-2 font-semibold">Conexión con la API</h2>
        {listado.cargando && <p className="text-gray-500">Consultando…</p>}
        {listado.error && (
          <p className="rounded bg-red-50 p-3 text-red-700">
            No se pudo conectar: {listado.error}
          </p>
        )}
        {listado.datos && (
          <p className="rounded bg-green-50 p-3 text-green-700">
            Conectado. {listado.datos.length} cuenta(s) registrada(s).
          </p>
        )}
      </section>

      {resumen.datos && (
        <section>
          <h2 className="mb-2 font-semibold">Resumen del mes</h2>
          <ul className="space-y-1">
            <li>Ingresos: {resumen.datos.totalIngresos}</li>
            <li>Egresos: {resumen.datos.totalEgresos}</li>
            <li className="font-semibold">Balance: {resumen.datos.balance}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
