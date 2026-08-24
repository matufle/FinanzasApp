namespace FinanzasApp.Domain.Enums;

//La idea de esto es no utilizar un bool nomas sino que
//tener un estado el cual poder registrar nunca se modifica.

public enum EstadoRegistro
{
    Activo = 0,
    Inactivo = 1
}