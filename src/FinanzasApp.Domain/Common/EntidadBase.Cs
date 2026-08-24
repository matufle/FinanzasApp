namespace FinanzasApp.Domain.Common;

//Base compartida por todas las entidades, con un id propio 
// y una fecha de creación para no repetir campos.
public abstract class EntidadBase
{
    public Guid Id { get; set; }
    public DateTime FechaCreacion { get; set; }

    protected EntidadBase()
    {
        Id = Guid.NewGuid();
        FechaCreacion = DateTime.UtcNow;
    }
}