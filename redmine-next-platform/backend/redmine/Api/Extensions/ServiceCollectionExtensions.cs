using Microsoft.OpenApi.Models;

namespace Redmine.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Redmine Next Platform API",
                Version = "v1"
            });
        });

        services.AddHealthChecks();

        return services;
    }
}
