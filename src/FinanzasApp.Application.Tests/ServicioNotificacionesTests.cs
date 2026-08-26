using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Interfaces;
using FinanzasApp.Application.Servicios;
using FinanzasApp.Application.Tests.Dobles;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Tests;

// Lo que se prueba aca no es que la notificacion llegue —eso depende de Google
// y de Apple— sino las dos decisiones que toma el servicio y que son faciles de
// romper sin darse cuenta: cuando corresponde avisar y que hacer con las
// suscripciones que ya no sirven.
//
// El dia de referencia es el 26/08/2026 en hora argentina, que en UTC va desde
// las 03:00 de ese dia hasta las 03:00 del 27.
public class ServicioNotificacionesTests
{
    private static readonly DateTime InicioDelDia = new(2026, 8, 26, 3, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime FinDelDia = new(2026, 8, 27, 3, 0, 0, DateTimeKind.Utc);

    private readonly RepositorioMovimientoFalso _movimientos = new();
    private readonly RepositorioSuscripcionPushFalso _suscripciones = new();
    private readonly EnviadorPushFalso _enviador = new();
    private readonly ServicioNotificaciones _servicio;

    public ServicioNotificacionesTests()
    {
        _servicio = new ServicioNotificaciones(_suscripciones, _movimientos, _enviador);
    }

    private void Suscribir(string endpoint) =>
        _suscripciones.Suscripciones.Add(new SuscripcionPush { Endpoint = endpoint });

    private void CargarMovimiento(DateTime alta, EstadoRegistro estado = EstadoRegistro.Activo) =>
        _movimientos.Movimientos.Add(new Movimiento
        {
            FechaCreacion = alta,
            Monto = 1000m,
            Tipo = TipoMovimiento.Egreso,
            Estado = estado
        });

    [Fact]
    public async Task No_avisa_si_ya_se_cargo_un_movimiento_hoy()
    {
        Suscribir("https://push.ejemplo/1");
        CargarMovimiento(new DateTime(2026, 8, 26, 14, 0, 0, DateTimeKind.Utc));

        var resultado = await _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia);

        Assert.True(resultado.Salteado);
        Assert.Empty(_enviador.Enviados);
    }

    [Fact]
    public async Task Avisa_si_el_dia_paso_sin_movimientos()
    {
        Suscribir("https://push.ejemplo/1");
        Suscribir("https://push.ejemplo/2");

        var resultado = await _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia);

        Assert.False(resultado.Salteado);
        Assert.Equal(2, resultado.Enviadas);
        Assert.Equal(2, _enviador.Enviados.Count);
    }

    [Fact]
    public async Task El_movimiento_de_ayer_no_cuenta_como_carga_de_hoy()
    {
        Suscribir("https://push.ejemplo/1");
        // 25/08 a las 22:00 hora argentina, o sea el 26 a las 01:00 UTC: es de
        // ayer aunque en UTC caiga el mismo dia que arranca la ventana.
        CargarMovimiento(new DateTime(2026, 8, 26, 1, 0, 0, DateTimeKind.Utc));

        var resultado = await _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia);

        Assert.False(resultado.Salteado);
        Assert.Equal(1, resultado.Enviadas);
    }

    [Fact]
    public async Task Un_movimiento_dado_de_baja_no_cuenta_como_carga()
    {
        Suscribir("https://push.ejemplo/1");
        CargarMovimiento(new DateTime(2026, 8, 26, 14, 0, 0, DateTimeKind.Utc), EstadoRegistro.Inactivo);

        var resultado = await _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia);

        Assert.False(resultado.Salteado);
        Assert.Equal(1, resultado.Enviadas);
    }

    [Fact]
    public async Task No_avisa_si_no_hay_ningun_dispositivo()
    {
        var resultado = await _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia);

        Assert.True(resultado.Salteado);
        Assert.Empty(_enviador.Enviados);
    }

    [Fact]
    public async Task La_suscripcion_vencida_se_borra_sola()
    {
        Suscribir("https://push.ejemplo/muerta");
        _enviador.Resultado = ResultadoPush.SuscripcionVencida;

        var resultado = await _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia);

        Assert.Equal(1, resultado.Vencidas);
        Assert.Empty(_suscripciones.Suscripciones);
    }

    [Fact]
    public async Task Un_fallo_pasajero_no_borra_la_suscripcion()
    {
        Suscribir("https://push.ejemplo/1");
        _enviador.Resultado = ResultadoPush.Fallo;

        var resultado = await _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia);

        Assert.Equal(1, resultado.Fallidas);
        Assert.Single(_suscripciones.Suscripciones);
    }

    [Fact]
    public async Task Suscribirse_dos_veces_no_duplica_el_dispositivo()
    {
        var peticion = new SuscripcionPushRequest("https://push.ejemplo/1", "p256", "auth", "Chrome");

        await _servicio.RegistrarAsync(peticion);
        await _servicio.RegistrarAsync(peticion with { Dispositivo = "Chrome en Windows" });

        Assert.Single(_suscripciones.Suscripciones);
        Assert.Equal("Chrome en Windows", _suscripciones.Suscripciones[0].Dispositivo);
    }

    [Fact]
    public async Task Dar_de_baja_algo_que_no_existe_no_explota()
    {
        await _servicio.DarDeBajaAsync("https://push.ejemplo/fantasma");

        Assert.Empty(_suscripciones.Suscripciones);
    }

    [Fact]
    public async Task Sin_claves_configuradas_avisa_en_vez_de_fallar_en_silencio()
    {
        Suscribir("https://push.ejemplo/1");
        _enviador.Configurado = false;

        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => _servicio.EnviarRecordatorioDiarioAsync(InicioDelDia, FinDelDia));
    }
}
