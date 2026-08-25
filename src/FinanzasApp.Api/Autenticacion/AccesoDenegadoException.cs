namespace FinanzasApp.Api.Autenticacion;

// Se lanza cuando alguien se logueo bien en Google pero no es el duenio de la
// app, o cuando el token que mando no es valido. El manejador de excepciones
// de Program.cs la traduce a un 401.
public sealed class AccesoDenegadoException(string mensaje) : Exception(mensaje);
