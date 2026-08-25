using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FinanzasApp.Api.Autenticacion;

// Convierte un login de Google en una sesion de Qwak.
//
// El flujo es: el navegador le pide a Google que identifique al usuario y
// recibe un "ID token" firmado por Google. Ese token se lo manda a esta Api,
// que lo verifica contra las claves publicas de Google, chequea que el email
// sea el permitido, y a cambio emite un token PROPIO de larga duracion.
//
// Se emite un token propio en vez de reusar el de Google porque el de Google
// dura una hora: en el celular eso significa volver a loguearse todo el tiempo.
public sealed class ServicioSesion(
    IOptions<OpcionesAutenticacion> opciones,
    ILogger<ServicioSesion> registro)
{
    public const string Emisor = "qwak";
    public const string Audiencia = "qwak-app";

    private readonly OpcionesAutenticacion _opciones = opciones.Value;

    public async Task<SesionDto> EntrarConGoogleAsync(string credencial)
    {
        if (!_opciones.TieneGoogleConfigurado)
        {
            throw new AccesoDenegadoException(
                "El login con Google no esta configurado en el servidor.");
        }

        GoogleJsonWebSignature.Payload carga;
        try
        {
            // Esto es lo que hace el trabajo pesado: baja las claves publicas de
            // Google, verifica la firma, la expiracion y que el token haya sido
            // emitido para nuestro Client ID (si no, cualquiera podria mandar un
            // token sacado de otra app).
            carga = await GoogleJsonWebSignature.ValidateAsync(credencial,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [_opciones.GoogleClientId]
                });
        }
        catch (InvalidJwtException ex)
        {
            registro.LogWarning(ex, "Llego una credencial de Google invalida.");
            throw new AccesoDenegadoException("La credencial de Google no es valida.");
        }

        if (carga.EmailVerified != true)
        {
            throw new AccesoDenegadoException("La cuenta de Google no tiene el email verificado.");
        }

        if (!EstaPermitido(carga.Email))
        {
            registro.LogWarning("Intento de acceso con un email no autorizado: {Email}", carga.Email);
            throw new AccesoDenegadoException("Esta cuenta no tiene acceso a la aplicacion.");
        }

        var usuario = new UsuarioDto(
            carga.Name ?? carga.Email,
            carga.Email,
            carga.Picture);

        var expira = DateTime.UtcNow.AddDays(_opciones.DiasDeSesion);
        return new SesionDto(EmitirToken(carga.Subject, usuario, expira), expira, usuario);
    }

    // Atajo para desarrollo: Program.cs solo publica el endpoint que llama a
    // esto cuando el entorno es Development, asi que no existe en produccion.
    public SesionDto EntrarComoDesarrollo()
    {
        var usuario = new UsuarioDto("Desarrollo", "dev@localhost", null);
        var expira = DateTime.UtcNow.AddDays(1);
        return new SesionDto(EmitirToken("dev", usuario, expira), expira, usuario);
    }

    private bool EstaPermitido(string email) =>
        _opciones.EmailsPermitidos.Any(permitido =>
            string.Equals(permitido.Trim(), email, StringComparison.OrdinalIgnoreCase));

    private string EmitirToken(string sujeto, UsuarioDto usuario, DateTime expira)
    {
        var clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opciones.ClaveFirma));

        var token = new JwtSecurityToken(
            issuer: Emisor,
            audience: Audiencia,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, sujeto),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
                new Claim(JwtRegisteredClaimNames.Name, usuario.Nombre),
                new Claim("foto", usuario.Foto ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            notBefore: DateTime.UtcNow,
            expires: expira,
            signingCredentials: new SigningCredentials(clave, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed record UsuarioDto(string Nombre, string Email, string? Foto);

public sealed record SesionDto(string Token, DateTime Expira, UsuarioDto Usuario);
