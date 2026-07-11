using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Application.Features.Users.DTOs;
using SmartHelpdesk.Domain.Common;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Users.Queries.GetUsers
{
    public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, PagedList<UserManagementDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetUsersQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PagedList<UserManagementDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
        {
            var query = _unitOfWork.Repository<User>().GetQueryable();

            if (request.IncludeDeleted)
            {
                query = query.IgnoreQueryFilters().Where(u => u.IsDeleted || !u.IsActive);
            }
            else
            {
                query = query.Where(u => u.IsActive && !u.IsDeleted);
            }

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                if (System.Enum.TryParse<SmartHelpdesk.Domain.Enums.UserRole>(request.Role, true, out var roleEnum))
                {
                    query = query.Where(u => u.Role == roleEnum);
                }
            }

            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var keyword = request.Keyword.ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(keyword) || u.Email.ToLower().Contains(keyword));
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(u => new UserManagementDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Role = u.Role.ToString(),
                    IsDeleted = u.IsDeleted || !u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedList<UserManagementDto>(users, totalCount, request.PageNumber, request.PageSize);
        }
    }
}
