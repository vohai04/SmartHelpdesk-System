using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SmartHelpdesk.Application.Features.Users.Commands.RestoreUser
{
    public class RestoreUserCommandHandler : IRequestHandler<RestoreUserCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public RestoreUserCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(RestoreUserCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Repository<User>().GetQueryable()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null)
            {
                throw new Exception($"User with Id {request.UserId} not found.");
            }

            user.IsActive = true;
            user.IsDeleted = false;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
