using Npgsql;

namespace FinanzasApp.Api.Configuracion;

// Supabase, Neon, Railway y Render entregan la conexion como URL
// (postgresql://usuario:clave@host/base), pero Npgsql espera el formato
// "Host=...;Username=...". Esta clase traduce de uno al otro para que
// puedas pegar la URL tal cual te la da el proveedor.
public static class CadenaConexion
{
    public static string Resolver(IConfiguration configuracion)
    {
        var valor = configuracion.GetConnectionString("Postgres");

        // Ojo: appsettings trae la clave como string vacio, no como null,
        // asi que hay que chequear con IsNullOrWhiteSpace y no con ??.
        if (string.IsNullOrWhiteSpace(valor))
            valor = Environment.GetEnvironmentVariable("DATABASE_URL");

        if (string.IsNullOrWhiteSpace(valor))
            throw new InvalidOperationException(
                "Falta la cadena de conexion. Configura 'ConnectionStrings:Postgres' " +
                "o la variable de entorno DATABASE_URL.");

        return EsUrl(valor) ? ConvertirUrl(valor) : valor;
    }

    private static bool EsUrl(string valor) =>
        valor.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
        valor.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);

    private static string ConvertirUrl(string url)
    {
        var uri = new Uri(url);
        var partes = uri.UserInfo.Split(':', 2);

        var constructor = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(partes[0]),
            Password = partes.Length > 1 ? Uri.UnescapeDataString(partes[1]) : string.Empty,
            SslMode = SslMode.Require,

            // Los planes gratis de estos proveedores tienen un tope de conexiones
            // simultaneas bastante bajo, y Npgsql por defecto se guarda hasta 100
            // por proceso. Con varias instancias en paralelo eso alcanza para
            // agotar el tope y dejar la base sin atender a nadie. Diez por
            // instancia es de sobra para una app de este tamaño.
            MaxPoolSize = 10
        };

        return constructor.ToString();
    }
}
