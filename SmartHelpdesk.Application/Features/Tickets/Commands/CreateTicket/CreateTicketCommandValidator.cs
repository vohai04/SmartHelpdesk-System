using FluentValidation;

namespace SmartHelpdesk.Application.Features.Tickets.Commands.CreateTicket
{
    public class CreateTicketCommandValidator : AbstractValidator<CreateTicketCommand>
    {
        public CreateTicketCommandValidator()
        {
            RuleFor(v => v.Title)
                .NotEmpty().WithMessage("Tiêu đề không được để trống.")
                .MaximumLength(200).WithMessage("Tiêu đề không được vượt quá 200 ký tự.");

            RuleFor(v => v.Description)
                .NotEmpty().WithMessage("Nội dung không được để trống.");

            RuleFor(v => v.CategoryId)
                .NotEmpty().WithMessage("Phải chọn danh mục cho Ticket.");
                
            RuleFor(v => v.CreatedById)
                .NotEmpty().WithMessage("Mã người tạo không hợp lệ.");
        }
    }
}
