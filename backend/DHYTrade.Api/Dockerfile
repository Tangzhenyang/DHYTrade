FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY DHYTrade.Api.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:5000

COPY --from=build /app/publish ./

RUN mkdir -p /app/data

EXPOSE 5000

ENTRYPOINT ["dotnet", "DHYTrade.Api.dll"]