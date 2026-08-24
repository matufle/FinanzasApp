using FinanzasApp.Domain.Common;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Domain.Entities;

// El movimiento es el registro de plata que entra o sale de una cuenta.
// El Monto siempre se guarda positivo; el signo lo define el Tipo,
// asi no hay que andar cuidando numeros negativos en cada consulta.
public class Movimiento : EntidadBase
{
    public decimal Monto { get; set; }
    public TipoMovimiento Tipo { get; set; }
    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public EstadoRegistro Estado { get; set; } = EstadoRegistro.Activo;

    public Guid CuentaId { get; set; }
    public Cuenta? Cuenta { get; set; }

    public Guid CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }

    // Devuelve el monto con signo, para poder sumar movimientos directamente.
    public decimal MontoConSigno => Tipo == TipoMovimiento.Ingreso ? Monto : -Monto;
}
