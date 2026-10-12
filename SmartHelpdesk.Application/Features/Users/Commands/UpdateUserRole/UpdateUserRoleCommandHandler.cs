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
        private readonly SmartHelpdesk.Application.Interfaces.IAccountSessions _sessions;

        public UpdateUserRoleCommandHandler(IUnitOfWork unitOfWork, SmartHelpdesk.Application.Interfaces.IAccountSessions sessions)
        {
            _unitOfWork = unitOfWork;
            _sessions = sessions;
        }

        public async Task<bool> Handle(UpdateUserRoleCommand request, CancellationToken cancellationToken)
        {
            var repository = _unitOfWork.Repository<User>();
            await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.LockUsersAsync(new[] { request.UserId, request.CurrentUserId }, cancellationToken);
            var actor = await _unitOfWork.Repository<User>().GetByIdAsync(request.CurrentUserId);
            if (actor is null || !actor.IsActive || actor.IsDeleted || actor.Role != Domain.Enums.UserRole.Admin) throw new UnauthorizedAccessException("Only an active Admin can manage accounts.");
            var user = await repository.GetByIdAsync(request.UserId);

            if (user == null || user.IsDeleted)
            {
                return false;
            }

            // Prevent demoting the last Admin
            if (user.Role == UserRole.Admin && request.Role != UserRole.Admin)
            {
                var allUsers = await repository.GetAllAsync();
                var activeAdmins = allUsers.Count(u => u.Role == UserRole.Admin && u.IsActive && !u.IsDeleted);
                if (activeAdmins <= 1)
                {
                    // Cannot demote the only admin
                    return false;
                }
            }

            if (user.Role == UserRole.Agent && request.Role != UserRole.Agent && _unitOfWork.Repository<Ticket>().GetQueryable().Any(t => (t.AssignedToId == user.Id || t.TransferTargetId == user.Id) && t.Status != TicketStatus.Closed && t.Status != TicketStatus.Resolved))
                throw new Domain.Exceptions.ConflictException("Transfer this agent's active tickets before changing their role.");
            if (!System.Enum.IsDefined(request.Role)) throw new Domain.Exceptions.BadRequestException("Invalid role.");
            await _unitOfWork.Repository<AuditLog>().AddAsync(new AuditLog { UserId = request.CurrentUserId, EntityName = "User", EntityId = user.Id, Action = "RoleChange", OldValues = user.Role.ToString(), NewValues = request.Role.ToString() });
            user.Role = request.Role;
            repository.Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            await _sessions.RevokeAsync(user.Id);

            return true;
        }
    }
}
