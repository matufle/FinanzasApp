namespace FinanzasApp.Application.Excepciones;

// Excepciones propias para que la API pueda traducirlas a codigos HTTP
// sin tener que adivinar que salio mal.
public class NoEncontradoException : Exception
{
    public NoEncontradoException(string mensaje) : base(mensaje) { }
}

public class ReglaDeNegocioException : Exception
{
    public ReglaDeNegocioException(string mensaje) : base(mensaje) { }
}
