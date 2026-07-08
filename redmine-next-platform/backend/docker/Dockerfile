FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/RedmineNextPlatform.sln backend/
COPY backend/redmine/Api/Redmine.Api.csproj backend/redmine/Api/
COPY backend/redmine/Application/Redmine.Application.csproj backend/redmine/Application/
COPY backend/redmine/Domain/Redmine.Domain.csproj backend/redmine/Domain/
COPY backend/redmine/Infrastructure/Redmine.Infrastructure.csproj backend/redmine/Infrastructure/
COPY backend/redmine/Services/Redmine.Services.csproj backend/redmine/Services/
COPY backend/tests/Unit/Redmine.Tests.Unit.csproj backend/tests/Unit/
COPY backend/tests/Integration/Redmine.Tests.Integration.csproj backend/tests/Integration/

RUN dotnet restore backend/RedmineNextPlatform.sln

COPY backend/ backend/
WORKDIR /src/backend/redmine/Api
RUN dotnet publish Redmine.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Redmine.Api.dll"]
