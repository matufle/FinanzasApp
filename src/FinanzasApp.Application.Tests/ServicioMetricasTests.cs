using FinanzasApp.Application.Excepciones;
using FinanzasApp.Application.Servicios;
using FinanzasApp.Application.Tests.Dobles;
using FinanzasApp.Domain.Entities;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Application.Tests;

// Las metricas son puras cuentas, y una cuenta mal hecha no rompe nada: solo
// muestra un numero equivocado. Por eso conviene fijarlas con tests.
//
// Todos los casos se paran en el 15 de agosto de 2026 (mes de 31 dias, mitad
// transcurrida) para que la proyeccion de numeros redondos.
public class ServicioMetricasTests
{
    private static readonly DateTime Hoy = new(2026, 8, 15, 0, 0, 0, DateTimeKind.Utc);

    private readonly RepositorioMovimientoFalso _repositorio = new();
    private readonly ServicioMetricas _servicio;

    private readonly Categoria _sueldo = new() { Nombre = "Sueldo", Tipo = TipoMovimiento.Ingreso };
    private readonly Categoria _supermercado = new() { Nombre = "Supermercado", Tipo = TipoMovimiento.Egreso };
    private readonly Categoria _salidas = new() { Nombre = "Salidas", Tipo = TipoMovimiento.Egreso };

    private readonly Guid _cuentaBanco = Guid.NewGuid();
    private readonly Guid _cuentaEfectivo = Guid.NewGuid();

    public ServicioMetricasTests()
    {
        _servicio = new ServicioMetricas(_repositorio);
    }

    private void Cargar(DateTime fecha, decimal monto, Categoria categoria,
        Guid? cuenta = null, EstadoRegistro estado = EstadoRegistro.Activo)
    {
        _repositorio.Movimientos.Add(new Movimiento
        {
            Fecha = fecha,
            Monto = monto,
            Tipo = categoria.Tipo,
            Categoria = categoria,
            CategoriaId = categoria.Id,
            CuentaId = cuenta ?? _cuentaBanco,
            Estado = estado
        });
    }

    private static DateTime Dia(int anio, int mes, int dia) =>
        new(anio, mes, dia, 0, 0, 0, DateTimeKind.Utc);

    // Agosto: entraron 100.000 y salieron 45.000 en los primeros 15 dias.
    // Julio: entraron 80.000 y salieron 60.000.
    private void CargarAgostoYJulio()
    {
        Cargar(Dia(2026, 8, 1), 100_000m, _sueldo);
        Cargar(Dia(2026, 8, 5), 30_000m, _supermercado);
        Cargar(Dia(2026, 8, 10), 15_000m, _salidas);

        Cargar(Dia(2026, 7, 1), 80_000m, _sueldo);
        Cargar(Dia(2026, 7, 20), 60_000m, _supermercado);
    }

    [Fact]
    public async Task El_mes_actual_suma_ingresos_y_egresos_del_mes()
    {
        CargarAgostoYJulio();

        var metricas = await _servicio.ObtenerAsync(2026, 8, hoy: Hoy);

        Assert.Equal(2026, metricas.Actual.Anio);
        Assert.Equal(8, metricas.Actual.Mes);
        Assert.Equal("ago 2026", metricas.Actual.Etiqueta);
        Assert.Equal(100_000m, metricas.Actual.Ingresos);
        Assert.Equal(45_000m, metricas.Actual.Egresos);
        Assert.Equal(55_000m, metricas.Actual.Balance);
    }

    [Fact]
    public async Task Los_movimientos_anulados_no_cuentan()
    {
        CargarAgostoYJulio();
        Cargar(Dia(2026, 8, 12), 500_000m, _supermercado, estado: EstadoRegistro.Inactivo);

        var metricas = await _servicio.ObtenerAsync(2026, 8, hoy: Hoy);

        Assert.Equal(45_000m, metricas.Actual.Egresos);
    }

    [Fact]
    public async Task La_tasa_de_ahorro_es_la_proporcion_de_lo_que_entro_que_no_se_gasto()
    {
        CargarAgostoYJulio();

        var metricas = await _servicio.ObtenerAsync(2026, 8, hoy: Hoy);

        // 55.000 de 100.000 = 55%
        Assert.Equal(0.55m, metricas.TasaDeAhorro);
    }

    [Fact]
    public async Task La_tasa_de_ahorro_es_negativa_si_se_gasto_mas_de_lo_que_entro()
    {
        Cargar(Dia(2026, 8, 1), 100_000m, _sueldo);
        Cargar(Dia(2026, 8, 5), 150_000m, _supermercado);

        var metricas = await _servicio.ObtenerAsync(2026, 8, hoy: Hoy);

        Assert.Equal(-0.5m, metricas.TasaDeAhorro);
    }

    [Fact]
    public async Task Sin_ingresos_la_tasa_de_ahorro_no_se_calcula()
    {
        Cargar(Dia(2026, 8, 5), 30_000m, _supermercado);

        var metricas = await _servicio.ObtenerAsync(2026, 8, hoy: Hoy);

        // null y no cero: no se ahorro el 0%, es que no hay con que compararlo.
        Assert.Null(metricas.TasaDeAhorro);
    }

    [Fact]
    public async Task La_comparativa_mide_el_mes_actual_contra_el_anterior()
    {
        CargarAgostoYJulio();

        var comparativa = (await _servicio.ObtenerAsync(2026, 8, hoy: Hoy)).Comparativa;

        Assert.Equal(20_000m, comparativa.DiferenciaIngresos);   // 100.000 - 80.000
        Assert.Equal(0.25m, comparativa.VariacionIngresos);      // 25% mas
        Assert.Equal(-15_000m, comparativa.DiferenciaEgresos);   // 45.000 - 60.000
        Assert.Equal(-0.25m, comparativa.VariacionEgresos);      // 25% menos
        Assert.Equal(35_000m, comparativa.DiferenciaBalance);    // 55.000 - 20.000
    }

    [Fact]
    public async Task Si_el_mes_anterior_fue_cero_no_hay_porcentaje_de_variacion()
    {
        Cargar(Dia(2026, 8, 1), 100_000m, _sueldo);

        var comparativa = (await _servicio.ObtenerAsync(2026, 8, hoy: Hoy)).Comparativa;

        Assert.Equal(100_000m, comparativa.DiferenciaIngresos);
        Assert.Null(comparativa.VariacionIngresos);
    }

    [Fact]
    public async Task La_proyeccion_estira_el_ritmo_de_gasto_hasta_fin_de_mes()
    {
        CargarAgostoYJulio();

        var proyeccion = (await _servicio.ObtenerAsync(2026, 8, hoy: Hoy)).Proyeccion;

        Assert.Equal(15, proyeccion.DiasTranscurridos);
        Assert.Equal(31, proyeccion.DiasDelMes);
        Assert.Equal(3_000m, proyeccion.PromedioDiarioEgresos);     // 45.000 / 15
        Assert.Equal(93_000m, proyeccion.EgresosProyectados);       // 3.000 * 31
        Assert.Equal(7_000m, proyeccion.BalanceProyectado);         // 100.000 - 93.000
        Assert.Equal(3_437.50m, proyeccion.DisponiblePorDia);       // 55.000 / 16 dias que faltan
    }

    [Fact]
    public async Task En_un_mes_ya_cerrado_la_proyeccion_es_lo_que_realmente_paso()
    {
        CargarAgostoYJulio();

        var metricas = await _servicio.ObtenerAsync(2026, 7, hoy: Hoy);

        Assert.Equal(31, metricas.Proyeccion.DiasTranscurridos);
        Assert.Equal(31, metricas.Proyeccion.DiasDelMes);
        Assert.Equal(60_000m, metricas.Proyeccion.EgresosProyectados);
        Assert.Equal(0m, metricas.Proyeccion.DisponiblePorDia);
    }

    [Fact]
    public async Task Si_ya_se_gasto_todo_lo_que_entro_no_queda_nada_disponible_por_dia()
    {
        Cargar(Dia(2026, 8, 1), 100_000m, _sueldo);
        Cargar(Dia(2026, 8, 5), 120_000m, _supermercado);

        var proyeccion = (await _servicio.ObtenerAsync(2026, 8, hoy: Hoy)).Proyeccion;

        Assert.Equal(0m, proyeccion.DisponiblePorDia);
    }

    [Fact]
    public async Task El_flujo_de_caja_trae_un_mes_por_columna_aunque_este_vacio()
    {
        CargarAgostoYJulio();

        var flujo = (await _servicio.ObtenerAsync(2026, 8, mesesFlujo: 6, hoy: Hoy)).FlujoDeCaja;

        Assert.Equal(6, flujo.Count);
        // Del mas viejo al mas nuevo: marzo a agosto.
        Assert.Equal(["mar 2026", "abr 2026", "may 2026", "jun 2026", "jul 2026", "ago 2026"],
            flujo.Select(p => p.Etiqueta));
        // Los meses sin movimientos vienen en cero, no faltan.
        Assert.All(flujo.Take(4), p => Assert.Equal(0m, p.Ingresos));
        Assert.Equal(80_000m, flujo[4].Ingresos);
        Assert.Equal(100_000m, flujo[5].Ingresos);
    }

    [Fact]
    public async Task El_flujo_de_caja_cruza_el_cambio_de_anio()
    {
        Cargar(Dia(2025, 12, 10), 50_000m, _sueldo);

        var flujo = (await _servicio.ObtenerAsync(2026, 2, mesesFlujo: 4, hoy: Hoy)).FlujoDeCaja;

        Assert.Equal(["nov 2025", "dic 2025", "ene 2026", "feb 2026"],
            flujo.Select(p => p.Etiqueta));
        Assert.Equal(50_000m, flujo[1].Ingresos);
    }

    [Fact]
    public async Task El_top_de_egresos_ordena_las_categorias_de_mayor_a_menor()
    {
        CargarAgostoYJulio();

        var top = (await _servicio.ObtenerAsync(2026, 8, hoy: Hoy)).TopEgresos;

        Assert.Equal(2, top.Count);
        Assert.Equal("Supermercado", top[0].CategoriaNombre);
        Assert.Equal(30_000m, top[0].Total);
        Assert.Equal("Salidas", top[1].CategoriaNombre);
        Assert.Equal(15_000m, top[1].Total);
    }

    [Fact]
    public async Task El_top_de_egresos_no_incluye_los_ingresos_ni_otros_meses()
    {
        CargarAgostoYJulio();

        var top = (await _servicio.ObtenerAsync(2026, 8, hoy: Hoy)).TopEgresos;

        Assert.DoesNotContain(top, c => c.CategoriaNombre == "Sueldo");
        // Julio tambien tuvo Supermercado, pero su monto no se mezcla.
        Assert.Equal(30_000m, top.Single(c => c.CategoriaNombre == "Supermercado").Total);
    }

    [Fact]
    public async Task Filtrar_por_cuenta_deja_afuera_los_movimientos_de_las_demas()
    {
        Cargar(Dia(2026, 8, 5), 30_000m, _supermercado, cuenta: _cuentaBanco);
        Cargar(Dia(2026, 8, 6), 7_000m, _salidas, cuenta: _cuentaEfectivo);

        var metricas = await _servicio.ObtenerAsync(2026, 8, cuentaId: _cuentaEfectivo, hoy: Hoy);

        Assert.Equal(7_000m, metricas.Actual.Egresos);
        Assert.Equal("Salidas", Assert.Single(metricas.TopEgresos).CategoriaNombre);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    public async Task Un_mes_fuera_de_rango_es_un_error_de_negocio(int mes)
    {
        await Assert.ThrowsAsync<ReglaDeNegocioException>(
            () => _servicio.ObtenerAsync(2026, mes, hoy: Hoy));
    }

    [Fact]
    public async Task Pedir_un_solo_mes_de_flujo_igual_devuelve_el_anterior_para_comparar()
    {
        CargarAgostoYJulio();

        // El minimo es 2: sin el mes anterior no habria contra que comparar.
        var metricas = await _servicio.ObtenerAsync(2026, 8, mesesFlujo: 1, hoy: Hoy);

        Assert.Equal(2, metricas.FlujoDeCaja.Count);
        Assert.Equal("jul 2026", metricas.Anterior.Etiqueta);
        Assert.Equal(80_000m, metricas.Anterior.Ingresos);
    }
}
