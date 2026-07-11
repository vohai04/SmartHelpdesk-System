using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace SmartHelpdesk.Application.Features.Tickets.Queries.SuggestTicketReply
{
    public class SuggestTicketReplyQueryHandler : IRequestHandler<SuggestTicketReplyQuery, string>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAiService _aiService;

        public SuggestTicketReplyQueryHandler(IUnitOfWork unitOfWork, IAiService aiService)
        {
            _unitOfWork = unitOfWork;
            _aiService = aiService;
        }

        public async Task<string> Handle(SuggestTicketReplyQuery request, CancellationToken cancellationToken)
        {
            var ticket = await _unitOfWork.Repository<Ticket>().GetByIdAsync(request.TicketId);
            if (ticket == null)
                throw new Exception($"Không tìm thấy Ticket với Id {request.TicketId}");

            var user = await _unitOfWork.Repository<User>().GetByIdAsync(request.CurrentUserId);
            var fullName = user?.FullName ?? "Bộ phận Chăm sóc khách hàng";
            var roleStr = user?.Role.ToString() ?? "Hỗ trợ viên";
            var role = roleStr == "Admin" ? "Quản trị viên" : "Chuyên viên hỗ trợ";

            var messages = await _unitOfWork.Repository<TicketMessage>()
                .GetQueryable()
                .Include(m => m.Sender)
                .Where(m => m.TicketId == request.TicketId && !m.IsInternalNote)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync(cancellationToken);

            var chatHistory = string.Join("\n\n", messages.Select(m => 
                $"{(m.Sender?.Role.ToString() == "Customer" ? "Khách hàng" : "Agent")} ({m.Sender?.FullName ?? "Unknown"}):\n{m.Content}"));

            if (string.IsNullOrWhiteSpace(chatHistory))
            {
                chatHistory = "(Chưa có tin nhắn nào trong ticket này)";
            }

            return await _aiService.SuggestReplyAsync(ticket.Title, ticket.Description, chatHistory, fullName, role, cancellationToken);
        }
    }
}
