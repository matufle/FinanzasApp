using FinanzasApp.Application.Dtos;
using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Servicios;
using FinanzasApp.Application.Tests.Dobles;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Tests;

// Registrar un movimiento es el caso de uso con mas reglas: es el unico lugar
// donde se cruza la categoria elegida contra el tipo del movimiento. Si esa
// validacion se cae, la app deja cargar un ingreso en "Supermercado" y todos
// los reportes quedan mal para siempre.
public class ServicioMovimientoTests
{
    private readonly RepositorioMovimientoFalso _movimientos = new();
    private readonly RepositorioCuentaFalso _cuentas = new();
    private readonly RepositorioCategoriaFalso _categorias = new();
    private readonly ServicioMovimiento _servicio;

    private readonly Cuenta _banco = new() { Nombre = "Banco", SaldoInicial = 0 };
    private readonly Categoria _sueldo = new() { Nombre = "Sueldo", Tipo = TipoMovimiento.Ingreso };
    private readonly Categoria _supermercado = new() { Nombre = "Supermercado", Tipo = TipoMovimiento.Egreso };

    public ServicioMovimientoTests()
    {
        _cuentas.Cuentas.Add(_banco);
        _categorias.Categorias.AddRange([_sueldo, _supermercado]);
        _servicio = new ServicioMovimiento(_movimientos, _cuentas, _categorias);
    }

    private CrearMovimientoRequest Pedido(
        decimal monto = 1_000m,
        string tipo = "Egreso",
        Categoria? categoria = null,
        Guid? cuentaId = null) =>
        new(monto, tipo, new DateTime(2026, 8, 25, 0, 0, 0, DateTimeKind.Utc), "Compra",
            cuentaId ?? _banco.Id, (categoria ?? _supermercado).Id);

    [Fact]
    public async Task Un_egreso_valido_se_guarda_y_vuelve_con_los_nombres_resueltos()
    {
        var creado = await _servicio.CrearAsync(Pedido(monto: 12_500m));

        Assert.Equal(12_500m, creado.Monto);
        Assert.Equal("Egreso", creado.Tipo);
        Assert.Equal("Banco", creado.CuentaNombre);
        Assert.Equal("Supermercado", creado.CategoriaNombre);
        Assert.Single(_movimientos.Movimientos);
    }

    [Fact]
    public async Task No_se_puede_usar_una_categoria_de_ingreso_en_un_egreso()
    {
        var error = await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => _servicio.CrearAsync(Pedido(tipo: "Egreso", categoria: _sueldo)));

        Assert.Contains("Sueldo", error.Message);
        Assert.Empty(_movimientos.Movimientos);
    }

    [Fact]
    public async Task No_se_puede_usar_una_categoria_de_egreso_en_un_ingreso()
    {
        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => _servicio.CrearAsync(Pedido(tipo: "Ingreso", categoria: _supermercado)));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task El_monto_tiene_que_ser_mayor_a_cero(decimal monto)
    {
        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => _servicio.CrearAsync(Pedido(monto: monto)));
    }

    [Fact]
    public async Task El_tipo_tiene_que_ser_Ingreso_o_Egreso()
    {
        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => _servicio.CrearAsync(Pedido(tipo: "Transferencia")));
    }

    [Fact]
    public async Task El_tipo_no_distingue_mayusculas()
    {
        var creado = await _servicio.CrearAsync(Pedido(tipo: "egreso"));

        Assert.Equal("Egreso", creado.Tipo);
    }

    [Fact]
    public async Task Una_cuenta_inexistente_da_no_encontrado()
    {
        await Assert.ThrowsAsync<NoEncontradoException>(
            () => _servicio.CrearAsync(Pedido(cuentaId: Guid.NewGuid())));
    }

    [Fact]
    public async Task Una_categoria_inexistente_da_no_encontrado()
    {
        var fantasma = new Categoria { Nombre = "No existe", Tipo = TipoMovimiento.Egreso };

        await Assert.ThrowsAsync<NoEncontradoException>(
            () => _servicio.CrearAsync(Pedido(categoria: fantasma)));
    }

    [Fact]
    public async Task Anular_deja_el_movimiento_inactivo_en_vez_de_borrarlo()
    {
        var creado = await _servicio.CrearAsync(Pedido());

        await _servicio.AnularAsync(creado.Id);

        var guardado = Assert.Single(_movimientos.Movimientos);
        Assert.Equal(EstadoRegistro.Inactivo, guardado.Estado);
    }

    [Fact]
    public async Task Anular_algo_que_no_existe_da_no_encontrado()
    {
        await Assert.ThrowsAsync<NoEncontradoException>(
            () => _servicio.AnularAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task Un_rango_de_fechas_al_reves_es_un_error_de_negocio()
    {
        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => _servicio.ObtenerPorRangoAsync(
                new DateTime(2026, 8, 31, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc)));
    }
}
