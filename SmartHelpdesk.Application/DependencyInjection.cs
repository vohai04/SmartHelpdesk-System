using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SmartHelpdesk.Application.Behaviors;

namespace SmartHelpdesk.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            var assembly = Assembly.GetExecutingAssembly();

            // Đăng ký MediatR và gắn ValidationBehavior vào Pipeline
            services.AddMediatR(config =>
            {
                config.RegisterServicesFromAssembly(assembly);
                config.AddOpenBehavior(typeof(ValidationBehavior<,>));
            });

            // Tự động quét và đăng ký tất cả các Validator có trong tầng Application
            services.AddValidatorsFromAssembly(assembly);

            return services;
        }
    }
}
