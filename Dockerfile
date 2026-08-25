# Imagen de la Api. Se arma desde la raiz del repositorio:
#   docker build -t qwak-api .
#
# El build va en dos etapas para que la imagen final no cargue con el SDK de
# .NET (unos 800 MB) sino solo con el runtime: queda cerca de 100 MB, que es lo
# que se sube y se baja en cada deploy.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /origen

# Los .csproj van primero, solos: mientras no cambien las dependencias, Docker
# reutiliza la capa del restore y el build siguiente se saltea la descarga de
# todos los paquetes de NuGet.
COPY src/FinanzasApp.Domain/FinanzasApp.Domain.csproj src/FinanzasApp.Domain/
COPY src/FinanzasApp.Application/FinanzasApp.Application.csproj src/FinanzasApp.Application/
COPY src/FinanzasApp.Infrastructure/FinanzasApp.Infrastructure.csproj src/FinanzasApp.Infrastructure/
COPY src/FinanzasApp.Api/FinanzasApp.Api.csproj src/FinanzasApp.Api/
RUN dotnet restore src/FinanzasApp.Api/FinanzasApp.Api.csproj

COPY src/ src/
RUN dotnet publish src/FinanzasApp.Api/FinanzasApp.Api.csproj -c Release -o /publicado --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /publicado .

# Kestrel escucha en 8080 salvo que el proveedor pida otro puerto por la
# variable PORT, que es lo que hacen Render, Railway y Cloud Run. De eso se
# ocupa Program.cs.
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Usuario sin privilegios que ya viene definido en la imagen de Microsoft.
USER $APP_UID

ENTRYPOINT ["dotnet", "FinanzasApp.Api.dll"]
