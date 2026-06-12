using FluentValidation;

namespace SmartHelpdesk.Application.Features.Messages.Commands.AddMessage
{
    public class AddMessageCommandValidator : AbstractValidator<AddMessageCommand>
    {
        public AddMessageCommandValidator()
        {
            RuleFor(v => v.TicketId)
                .NotEmpty().WithMessage("TicketId is required.");

            RuleFor(v => v.SenderId)
                .NotEmpty().WithMessage("SenderId is required.");

            RuleFor(v => v.Content)
                .NotEmpty().WithMessage("Content is required.")
                .MaximumLength(5000).WithMessage("Content must not exceed 5000 characters.");
        }
    }
}
