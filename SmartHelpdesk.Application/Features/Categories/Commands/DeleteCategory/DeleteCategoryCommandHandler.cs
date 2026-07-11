using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Features.Categories.Commands.DeleteCategory
{
    public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteCategoryCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
        {
            var repository = _unitOfWork.Repository<Category>();
            var category = await repository.GetByIdAsync(request.Id);

            if (category == null || category.IsDeleted)
            {
                return false;
            }

            // Soft delete
            category.IsDeleted = true;

            repository.Update(category);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
