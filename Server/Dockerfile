# Use .NET 9 SDK to build the app
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# ✅ FIX: Use correct nested path based on your file structure
COPY ["Server/Server/Server.csproj", "Server/"] 
RUN dotnet restore "Server/Server.csproj"

# Copy all files for build
COPY . .
WORKDIR "/src/Server/Server"
RUN dotnet build "Server.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Server.csproj" -c Release -o /app/publish

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 5000
EXPOSE 443
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Server.dll"]
