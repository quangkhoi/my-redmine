using FluentValidation;
using Microsoft.OpenApi.Models;
using Redmine.Application.Features.Dashboard.Queries.GetDashboard;
using Redmine.Application.Features.Dashboard.Services;
using Redmine.Application.Features.DailyReport.Queries.GetDailyReport;
using Redmine.Application.Features.DailyReport.Services;
using Redmine.Application.Features.LogTime.Queries.GetLogTime;
using Redmine.Application.Features.LogTime.Services;
using Redmine.Application.Features.MyTask.Queries.GetMyTask;
using Redmine.Application.Features.MyTask.Services;
using Redmine.Application.Features.WeeklyReport.Queries.GetWeeklyReport;
using Redmine.Application.Features.WeeklyReport.Services;
using Redmine.Services.Dashboard;
using Redmine.Services.DailyReport;
using Redmine.Services.LogTime;
using Redmine.Services.MyTask;
using Redmine.Services.WeeklyReport;

namespace Redmine.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Redmine Next Platform API",
                Version = "v1"
            });
        });

        services.AddScoped<IValidator<GetMyTaskQuery>, GetMyTaskQueryValidator>();
        services.AddScoped<GetMyTaskHandler>();
        services.AddScoped<IMyTaskReader, InMemoryMyTaskReader>();

        services.AddScoped<IValidator<GetDashboardQuery>, GetDashboardQueryValidator>();
        services.AddScoped<GetDashboardHandler>();
        services.AddScoped<IDashboardReader, InMemoryDashboardReader>();

        services.AddScoped<IValidator<GetDailyReportQuery>, GetDailyReportQueryValidator>();
        services.AddScoped<GetDailyReportHandler>();
        services.AddScoped<IDailyReportReader, InMemoryDailyReportReader>();

        services.AddScoped<IValidator<GetLogTimeQuery>, GetLogTimeQueryValidator>();
        services.AddScoped<GetLogTimeHandler>();
        services.AddScoped<ILogTimeReader, InMemoryLogTimeReader>();

        services.AddScoped<IValidator<GetWeeklyReportQuery>, GetWeeklyReportQueryValidator>();
        services.AddScoped<GetWeeklyReportHandler>();
        services.AddScoped<IWeeklyReportReader, InMemoryWeeklyReportReader>();

        services.AddHealthChecks();

        return services;
    }
}
