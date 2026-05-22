FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY DHYTrade.Api.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV TZ=Asia/Shanghai
ENV ASPNETCORE_URLS=http://0.0.0.0:5000

RUN apt-get update \
	&& apt-get install -y --no-install-recommends tzdata \
	&& ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
	&& echo $TZ > /etc/timezone \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish ./

RUN mkdir -p /app/data

EXPOSE 5000

ENTRYPOINT ["dotnet", "DHYTrade.Api.dll"]