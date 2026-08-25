namespace FinanzasApp.Application.Dtos;

// Todo lo que muestra la pantalla de Metricas viaja en una sola respuesta.
// Se calcula sobre un mes concreto (el que el usuario esta mirando) y se
// devuelve junto con el contexto que necesita para tener sentido: el mes
// anterior para comparar y los ultimos meses para el grafico de barras.
public record MetricasDto(
    PeriodoDto Actual,
    PeriodoDto Anterior,
    ComparativaDto Comparativa,

    // Porcentaje de lo que entro que no se gasto, entre 0 y 1
    // (0,25 = se ahorro el 25% del mes). Es null si no hubo ingresos:
    // sin ingresos la tasa no significa nada y mostrar 0% enganaria.
    decimal? TasaDeAhorro,

    ProyeccionDto Proyeccion,

    // Del mes mas viejo al mas nuevo, para pintarlo de izquierda a derecha.
    IReadOnlyList<PeriodoDto> FlujoDeCaja,

    // Categorias de egreso del mes actual, de mayor a menor.
    IReadOnlyList<ResumenCategoriaDto> TopEgresos);

// Un mes cerrado: cuanto entro, cuanto salio y la diferencia.
public record PeriodoDto(
    int Anio,
    int Mes,
    // "ago 2026", ya armada por el backend para no repetir el formateo
    // de meses en cada pantalla.
    string Etiqueta,
    decimal Ingresos,
    decimal Egresos,
    decimal Balance);

// El mes actual contra el anterior. Las diferencias van en plata; las
// variaciones en proporcion (0,15 = 15% mas). La variacion es null cuando el
// mes anterior fue cero, porque dividir por cero no da un porcentaje que
// se pueda mostrar.
public record ComparativaDto(
    decimal DiferenciaIngresos,
    decimal? VariacionIngresos,
    decimal DiferenciaEgresos,
    decimal? VariacionEgresos,
    decimal DiferenciaBalance);

// Como termina el mes si se sigue gastando al mismo ritmo.
// Para un mes ya terminado la proyeccion coincide con lo real.
public record ProyeccionDto(
    int DiasTranscurridos,
    int DiasDelMes,
    decimal PromedioDiarioEgresos,
    decimal EgresosProyectados,
    decimal BalanceProyectado,
    // Cuanto se puede gastar por dia en lo que queda del mes sin terminar
    // en rojo. Cero si ya se gasto todo lo que entro.
    decimal DisponiblePorDia);
