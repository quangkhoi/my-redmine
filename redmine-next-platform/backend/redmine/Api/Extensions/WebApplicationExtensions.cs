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
        app.UseHttpsRedirection();
        app.MapControllers();
        app.MapHealthChecks("/health");

        return app;
    }
}
