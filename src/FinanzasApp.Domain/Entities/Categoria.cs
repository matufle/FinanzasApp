using FinanzasApp.Domain.Common;
using FinanzasApp.Domain.Enums;

namespace FinanzasApp.Domain.Entities;

// Cada categoria sirve para un solo tipo de movimiento: "Sueldo" es ingreso
// y "Supermercado" es egreso. Guardar el tipo acá evita clasificar mal despues.
public class Categoria : EntidadBase
{
    public string Nombre { get; set; } = string.Empty;
    public TipoMovimiento Tipo { get; set; }
    public EstadoRegistro Estado { get; set; } = EstadoRegistro.Activo;

    public ICollection<Movimiento> Movimientos { get; set; } = new List<Movimiento>();
}
