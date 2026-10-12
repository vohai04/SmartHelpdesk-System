using System;
using System.Threading;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Users.Commands.SoftDeleteUser
{
    public class SoftDeleteUserCommandHandler : IRequestHandler<SoftDeleteUserCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly SmartHelpdesk.Application.Interfaces.IAccountSessions _sessions;

        public SoftDeleteUserCommandHandler(IUnitOfWork unitOfWork, SmartHelpdesk.Application.Interfaces.IAccountSessions sessions)
        {
            _unitOfWork = unitOfWork;
            _sessions = sessions;
        }

        public async Task<bool> Handle(SoftDeleteUserCommand request, CancellationToken cancellationToken)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.LockUsersAsync(new[] { request.UserId, request.CurrentUserId }, cancellationToken);
            var actor = await _unitOfWork.Repository<User>().GetByIdAsync(request.CurrentUserId);
            if (actor is null || !actor.IsActive || actor.IsDeleted || actor.Role != Domain.Enums.UserRole.Admin) throw new UnauthorizedAccessException("Only an active Admin can manage accounts.");
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(request.UserId);
            if (user == null)
            {
                throw new Domain.Exceptions.NotFoundException($"User with Id {request.UserId} not found.");
            }

            if (_unitOfWork.Repository<Ticket>().GetQueryable().Any(t => (t.AssignedToId == user.Id || t.TransferTargetId == user.Id) && t.Status != Domain.Enums.TicketStatus.Closed && t.Status != Domain.Enums.TicketStatus.Resolved))
                throw new Domain.Exceptions.ConflictException("Transfer this agent's active tickets before disabling the account.");
            if (user.Id == request.CurrentUserId) throw new Domain.Exceptions.BadRequestException("You cannot deactivate your own account.");
            if (user.Role == Domain.Enums.UserRole.Admin && _unitOfWork.Repository<User>().GetQueryable().Count(u => u.Role == Domain.Enums.UserRole.Admin && u.IsActive) <= 1)
                throw new Domain.Exceptions.ConflictException("The last active Admin cannot be deactivated.");
            user.IsActive = false;
            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);

            var auditLog = new AuditLog
            {
                UserId = request.CurrentUserId,
                Action = "SoftDelete",
                EntityName = "User",
                EntityId = user.Id,
                NewValues = "IsActive: false, IsDeleted: true"
            };
            await _unitOfWork.Repository<AuditLog>().AddAsync(auditLog);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            await _sessions.RevokeAsync(user.Id);

            return true;
        }
    }
}
