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
using Redmine.Infrastructure.Features.Dashboard;
using Redmine.Infrastructure.Features.DailyReport;
using Redmine.Infrastructure.Features.LogTime;
using Redmine.Infrastructure.Features.MyTask;
using Redmine.Infrastructure.Features.WeeklyReport;
using Redmine.Infrastructure.Redmine;

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
                    .AllowAnyMethod()
                    .AllowCredentials();
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

        services.Configure<RedmineApiOptions>(configuration.GetSection("Redmine"));
        services.AddHttpClient<RedmineApiClient>(client =>
        {
            var baseUrl = configuration["Redmine:BaseUrl"];
            if (!string.IsNullOrWhiteSpace(baseUrl))
            {
                client.BaseAddress = new Uri(baseUrl);
            }
        });

        services.AddScoped<IRedmineIssueRepository, RedmineIssueRepository>();
        services.AddScoped<IRedmineReferenceDataRepository, RedmineReferenceDataRepository>();

        services.AddScoped<IValidator<GetMyTaskQuery>, GetMyTaskQueryValidator>();
        services.AddScoped<GetMyTaskHandler>();
        services.AddScoped<IMyTaskReader, MyTaskReader>();

        services.AddScoped<IValidator<GetDashboardQuery>, GetDashboardQueryValidator>();
        services.AddScoped<GetDashboardHandler>();
        services.AddScoped<IDashboardReader, DashboardReader>();

        services.AddScoped<IValidator<GetDailyReportQuery>, GetDailyReportQueryValidator>();
        services.AddScoped<GetDailyReportHandler>();
        services.AddScoped<IDailyReportReader, DailyReportReader>();

        services.AddScoped<IValidator<GetLogTimeQuery>, GetLogTimeQueryValidator>();
        services.AddScoped<GetLogTimeHandler>();
        services.AddScoped<ILogTimeReader, LogTimeReader>();

        services.AddScoped<IValidator<GetWeeklyReportQuery>, GetWeeklyReportQueryValidator>();
        services.AddScoped<GetWeeklyReportHandler>();
        services.AddScoped<IWeeklyReportReader, WeeklyReportReader>();

        services.AddHealthChecks();

        return services;
    }
}
