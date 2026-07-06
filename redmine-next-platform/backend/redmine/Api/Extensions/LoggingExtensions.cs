using Serilog;

namespace Redmine.Api.Extensions;

public static class LoggingExtensions
{
    public static IHostBuilder UseSerilogLogging(this IHostBuilder builder)
    {
        return builder.UseSerilog((context, services, loggerConfiguration) =>
        {
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .WriteTo.Console();
        });
    }
}
