using MediatR;
using SmartHelpdesk.Application.Features.Users.DTOs;
using SmartHelpdesk.Domain.Common;

namespace SmartHelpdesk.Application.Features.Users.Queries.GetUsers
{
    public class GetUsersQuery : IRequest<PagedList<UserManagementDto>>
    {
        public string? Keyword { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public bool IncludeDeleted { get; set; } = false;
        public string? Role { get; set; }
    }
}
