using FluentValidation;

namespace SmartHelpdesk.Application.Features.Auth.Commands.Register
{
    public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
    {
        public RegisterCommandValidator()
        {
            RuleFor(v => v.FullName).NotEmpty().WithMessage("Full Name is required.");
            RuleFor(v => v.Email).NotEmpty().EmailAddress().WithMessage("A valid Email is required.");
            RuleFor(v => v.Password).NotEmpty().MinimumLength(6).WithMessage("Password must be at least 6 characters.");
        }
    }
}
