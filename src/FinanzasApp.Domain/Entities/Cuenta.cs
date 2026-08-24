using FinanzasApp.Domain.Common;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Domain.Entities;

// Una cuenta es el lugar donde vive la plata: efectivo, banco, billetera virtual.
// El saldo actual no se guarda acá, se calcula sumando los movimientos
// sobre el saldo inicial, asi no queda un numero desincronizado en la base.
public class Cuenta : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public decimal SaldoInicial { get; set; }
    public EstadoRegistro Estado { get; set; } = EstadoRegistro.Activo;

    public ICollection<Movimiento> Movimientos { get; set; } = new List<Movimiento>();
}
