using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Application.Features.Auth.DTOs;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;
using System.Collections.Generic;

namespace SmartHelpdesk.Application.Features.Auth.Commands.Login
{
    public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;

        public LoginCommandHandler(IUnitOfWork unitOfWork, IJwtTokenGenerator jwtTokenGenerator)
        {
            _unitOfWork = unitOfWork;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

        public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var user = await _unitOfWork.Repository<User>().GetQueryable()
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

            // In production, ALWAYS use a proper Password Hasher (e.g., BCrypt). 
            // We use simple equality here to support the plaintext Seed Data.
            if (user == null || user.PasswordHash != request.Password)
            {
                throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("Your account is deactivated.");
            }

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
