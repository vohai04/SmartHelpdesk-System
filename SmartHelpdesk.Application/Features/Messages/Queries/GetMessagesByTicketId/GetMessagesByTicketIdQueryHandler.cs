using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Application.Features.Messages.DTOs;
using SmartHelpdesk.Domain.Common;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Messages.Queries.GetMessagesByTicketId
{
    public class GetMessagesByTicketIdQueryHandler : IRequestHandler<GetMessagesByTicketIdQuery, PagedList<TicketMessageDto>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetMessagesByTicketIdQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PagedList<TicketMessageDto>> Handle(GetMessagesByTicketIdQuery request, CancellationToken cancellationToken)
        {
            var query = _unitOfWork.Repository<TicketMessage>().GetQueryable()
                .Where(m => m.TicketId == request.TicketId);

            var totalCount = await query.CountAsync(cancellationToken);

            var messages = await query
                .Include(m => m.Sender)
                .OrderBy(m => m.CreatedAt) // Sắp xếp cũ trước, mới sau
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(m => new TicketMessageDto
                {
                    Id = m.Id,
                    TicketId = m.TicketId,
                    SenderId = m.SenderId,
                    SenderName = m.Sender != null ? m.Sender.FullName : "Unknown",
                    Content = m.Content,
                    IsInternalNote = m.IsInternalNote,
                    IsAiGenerated = m.IsAiGenerated,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedList<TicketMessageDto>(messages, totalCount, request.PageNumber, request.PageSize);
        }
    }
}
