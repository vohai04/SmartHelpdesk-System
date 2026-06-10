using Microsoft.EntityFrameworkCore;
using Serilog;
using SmartHelpdesk.Infrastructure.Persistence;
using SmartHelpdesk.WebApi.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Configure EF Core with PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add Global Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        // Tự động áp dụng Migration khi chạy ứng dụng
        await context.Database.MigrateAsync();
        // Tự động tạo dữ liệu mẫu
        await ApplicationDbContextSeed.SeedAsync(context);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Lỗi xảy ra trong quá trình Migrate hoặc Seed Database.");
    }
}

app.Run();
