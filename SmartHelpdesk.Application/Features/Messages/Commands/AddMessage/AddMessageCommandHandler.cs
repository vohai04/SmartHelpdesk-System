using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Features.Messages.Commands.AddMessage;
using SmartHelpdesk.Application.Features.Messages.DTOs;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Messages.Commands.AddMessage
{
    public class AddMessageCommandHandler : IRequestHandler<AddMessageCommand, TicketMessageDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;

        public AddMessageCommandHandler(IUnitOfWork unitOfWork, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
        }

        public async Task<TicketMessageDto> Handle(AddMessageCommand request, CancellationToken cancellationToken)
        {
            var ticketRepo = _unitOfWork.Repository<Ticket>();
            var ticket = await ticketRepo.GetByIdAsync(request.TicketId);

            if (ticket == null)
            {
                throw new KeyNotFoundException($"Ticket with ID {request.TicketId} not found");
            }

            var message = new TicketMessage
            {
                TicketId = request.TicketId,
                SenderId = request.SenderId,
                Content = request.Content,
                IsInternalNote = request.IsInternalNote,
                IsAiGenerated = false,
                CreatedAt = DateTime.UtcNow
            };

            var messageRepo = _unitOfWork.Repository<TicketMessage>();
            await messageRepo.AddAsync(message);

            // Cập nhật UpdatedAt của Ticket
            ticket.UpdatedAt = DateTime.UtcNow;
            ticketRepo.Update(ticket);

            // Link attachments if any
            var attachmentsList = new List<AttachmentDto>();
            if (request.AttachmentIds != null && request.AttachmentIds.Count > 0)
            {
                var attachmentRepo = _unitOfWork.Repository<Attachment>();
                var attachments = await attachmentRepo.FindAsync(a => request.AttachmentIds.Contains(a.Id));
                foreach (var att in attachments)
                {
                    att.TicketMessageId = message.Id;
                    attachmentRepo.Update(att);
                    
                    attachmentsList.Add(new AttachmentDto
                    {
                        Id = att.Id,
                        FileName = att.FileName,
                        FileUrl = att.FilePath,
                        ContentType = att.ContentType
                    });
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var userRepo = _unitOfWork.Repository<User>();
            var sender = await userRepo.GetByIdAsync(request.SenderId);

            if (!message.IsInternalNote)
            {
                if (sender?.Role == Domain.Enums.UserRole.Customer)
                {
                    await _notificationService.SendToAllAgentsAsync("Tin nhắn mới", $"Ticket #{ticket.Id.ToString().Split('-')[0].ToUpper()} có tin nhắn mới từ khách hàng.", ticket.Id.ToString(), message.Id.ToString());
                }
                else
                {
                    await _notificationService.SendToUserAsync(ticket.CreatedById, "Tin nhắn mới", $"Ticket #{ticket.Id.ToString().Split('-')[0].ToUpper()} vừa được phản hồi.", ticket.Id.ToString(), message.Id.ToString());
                }
            }

            return new TicketMessageDto
            {
                Id = message.Id,
                TicketId = message.TicketId,
                SenderId = message.SenderId,
                SenderName = sender?.FullName ?? "Unknown",
                Content = message.Content,
                IsInternalNote = message.IsInternalNote,
                IsAiGenerated = message.IsAiGenerated,
                CreatedAt = message.CreatedAt,
                Attachments = attachmentsList
            };
        }
    }
}
