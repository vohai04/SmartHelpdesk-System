using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Features.Auth.DTOs;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Auth.Commands.UpdateProfile
{
    public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, AuthResponseDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;

        public UpdateProfileCommandHandler(IUnitOfWork unitOfWork, IJwtTokenGenerator jwtTokenGenerator)
        {
            _unitOfWork = unitOfWork;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

        public async Task<AuthResponseDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            var userRepo = _unitOfWork.Repository<User>();
            var user = await userRepo.GetByIdAsync(request.UserId);

            if (user == null || !user.IsActive)
            {
                throw new Exception("User not found or inactive.");
            }

            user.FullName = request.FullName;

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var token = _jwtTokenGenerator.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString()
            };
        }
    }
}
