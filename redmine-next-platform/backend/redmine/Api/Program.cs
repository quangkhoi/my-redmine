using Redmine.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilogLogging();
builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

app.UseApiPipeline();

app.Run();
