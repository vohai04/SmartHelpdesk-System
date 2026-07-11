using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Features.Categories.Commands.UpdateCategory
{
    public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateCategoryCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
        {
            var repository = _unitOfWork.Repository<Category>();
            var category = await repository.GetByIdAsync(request.Id);

            if (category == null || category.IsDeleted)
            {
                return false;
            }

            category.Name = request.Name;
            category.Description = request.Description;
            category.AiRoutingKeywords = request.AiRoutingKeywords;

            repository.Update(category);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
