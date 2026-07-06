namespace Redmine.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors("Frontend");

        // Docker runtime only exposes HTTP. Redirecting to HTTPS there breaks browser calls
        // before CORS headers can be applied, so keep redirection off unless an HTTPS port exists.
        if (app.Environment.IsDevelopment() || !string.IsNullOrWhiteSpace(app.Configuration["ASPNETCORE_HTTPS_PORT"]))
        {
            app.UseHttpsRedirection();
        }

        app.MapControllers();
        app.MapHealthChecks("/health");

        return app;
    }
}
