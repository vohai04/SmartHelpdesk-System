using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;
using SmartHelpdesk.Domain.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Features.Users.Commands.UpdateUserRole
{
    public class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateUserRoleCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
        {
            var repository = _unitOfWork.Repository<User>();
            var user = await repository.GetByIdAsync(request.UserId);

            if (user == null || user.IsDeleted)
            {
                return false;
            }

            // Prevent demoting the last Admin
            if (user.Role == UserRole.Admin && request.Role != UserRole.Admin)
            {
                var allUsers = await repository.GetAllAsync();
                var activeAdmins = allUsers.Count(u => u.Role == UserRole.Admin && !u.IsDeleted);
                if (activeAdmins <= 1)
                {
                    // Cannot demote the only admin
                    return false;
                }
            }

            user.Role = request.Role;
            repository.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
