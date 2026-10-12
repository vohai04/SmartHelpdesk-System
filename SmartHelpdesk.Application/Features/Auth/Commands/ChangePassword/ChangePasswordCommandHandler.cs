using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Auth.Commands.ChangePassword
{
    public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public ChangePasswordCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
        {
            var userRepo = _unitOfWork.Repository<User>();
            var user = await userRepo.GetByIdAsync(request.UserId);

            if (user == null || !user.IsActive)
            {
                throw new Exception("User not found or inactive.");
            }

            // In production, use a secure password hasher (e.g., BCrypt.Verify)
            if (user.PasswordHash != request.CurrentPassword)
            {
                throw new Exception("Incorrect current password.");
            }

            // In production, use a secure password hasher (e.g., BCrypt.Hash)
            user.PasswordHash = request.NewPassword;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
