using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FinanzasApp.Api.Autenticacion;

public static class AutenticacionExtensiones
{
    private const int LargoMinimoDeClave = 32;

    // Registra todo lo necesario para que los endpoints puedan pedir sesion:
    // las opciones, el servicio que emite tokens y el validador de JWT.
    public static IServiceCollection AgregarAutenticacion(
        this IServiceCollection servicios,
        IConfiguration configuracion,
        IHostEnvironment entorno)
    {
        var opciones = configuracion
            .GetSection(OpcionesAutenticacion.Seccion)
            .Get<OpcionesAutenticacion>() ?? new OpcionesAutenticacion();

        RevisarConfiguracion(opciones, entorno);

        servicios.AddSingleton(Options.Create(opciones));
        servicios.AddScoped<ServicioSesion>();

        var clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opciones.ClaveFirma));

        servicios
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(jwt =>
            {
                // Sin esto ASP.NET renombra los claims cortos del token ("email",
                // "name") a las URIs largas de WS-Federation, y despues no se los
                // encuentra por el nombre con el que se escribieron.
                jwt.MapInboundClaims = false;

                // La Api valida su propio token, no el de Google: por eso no hay
                // Authority ni descarga de claves. La firma es simetrica y la
                // clave es la misma con la que ServicioSesion emite.
                jwt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = ServicioSesion.Emisor,
                    ValidateAudience = true,
                    ValidAudience = ServicioSesion.Audiencia,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = clave,
                    // Por defecto son 5 minutos de tolerancia; con sesiones de
                    // 30 dias no hace falta ser tan generoso.
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        servicios.AddAuthorization();

        return servicios;
    }

    private static void RevisarConfiguracion(OpcionesAutenticacion opciones, IHostEnvironment entorno)
    {
        var enDesarrollo = entorno.IsDevelopment();

        if (opciones.ClaveFirma.Length < LargoMinimoDeClave)
        {
            if (!enDesarrollo)
            {
                throw new InvalidOperationException(
                    $"Falta configurar '{OpcionesAutenticacion.Seccion}:ClaveFirma' con al menos " +
                    $"{LargoMinimoDeClave} caracteres. Ponela en la variable de entorno " +
                    $"'{OpcionesAutenticacion.Seccion}__ClaveFirma'.");
            }

            // En desarrollo se genera una al vuelo para no frenar el trabajo.
            // Consecuencia: cada reinicio de la Api invalida las sesiones abiertas.
            opciones.ClaveFirma = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        }

        if (enDesarrollo) return;

        if (!opciones.TieneGoogleConfigurado)
        {
            throw new InvalidOperationException(
                $"Falta configurar '{OpcionesAutenticacion.Seccion}:GoogleClientId'.");
        }

        if (opciones.EmailsPermitidos.Length == 0)
        {
            throw new InvalidOperationException(
                $"Falta configurar '{OpcionesAutenticacion.Seccion}:EmailsPermitidos'. " +
                "Sin al menos un email nadie podria entrar.");
        }
    }
}
