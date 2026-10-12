using System;
using System.Collections.Generic;
using System.Linq;
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
            await using var transaction = await _unitOfWork.BeginTransactionAsync(cancellationToken);
            await _unitOfWork.LockUsersAsync(new[] { request.SenderId }, cancellationToken);
            var ticketRepo = _unitOfWork.Repository<Ticket>();
            var ticket = await ticketRepo.GetByIdAsync(request.TicketId);

            if (ticket == null)
            {
                throw new SmartHelpdesk.Domain.Exceptions.NotFoundException($"Ticket with ID {request.TicketId} not found");
            }

            if (request.CurrentUserRole == Domain.Enums.UserRole.Customer.ToString())
            {
                if (ticket.CreatedById != request.SenderId)
                {
                    throw new UnauthorizedAccessException("You do not have permission to send messages to this ticket.");
                }
            }

            var actor = await _unitOfWork.Repository<User>().GetByIdAsync(request.SenderId);
            if (actor is null || !actor.IsActive || actor.IsDeleted) throw new UnauthorizedAccessException("Account unavailable.");
            if (ticket.Status == Domain.Enums.TicketStatus.Closed) throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("Reopen the ticket before replying.");
            if (actor.Role == Domain.Enums.UserRole.Agent && !request.IsInternalNote && ticket.AssignedToId != actor.Id)
                throw new UnauthorizedAccessException("Only the responsible agent can send a public reply.");
            if (!request.IsInternalNote && actor.Role != Domain.Enums.UserRole.Customer && ticket.Status == Domain.Enums.TicketStatus.Resolved)
                throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("Reopen the ticket before sending a public reply.");
            if (!request.IsInternalNote && actor.Role != Domain.Enums.UserRole.Customer && ticket.Status == Domain.Enums.TicketStatus.Open)
            {
                if (!ticket.AssignedToId.HasValue) throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("Assign the ticket before sending a public reply.");
                ticket.Status = Domain.Enums.TicketStatus.InProgress; ticket.StartedAt ??= DateTime.UtcNow;
            }
            var attachmentRepo = _unitOfWork.Repository<Attachment>();
            var selectedAttachments = request.AttachmentIds is { Count: > 0 }
                ? await attachmentRepo.FindAsync(a => request.AttachmentIds.Contains(a.Id)) : Array.Empty<Attachment>();
            if (request.AttachmentIds is { Count: > 0 } && (selectedAttachments.Count != request.AttachmentIds.Distinct().Count()
                || selectedAttachments.Any(a => a.UploadedById != actor.Id || a.TicketId != ticket.Id || a.TicketMessageId.HasValue)))
                throw new SmartHelpdesk.Domain.Exceptions.BadRequestException("Attachments must belong to you and this ticket and cannot already be attached.");
            if (!request.IsInternalNote && actor.Role == Domain.Enums.UserRole.Customer && ticket.Status is Domain.Enums.TicketStatus.WaitingForCustomer or Domain.Enums.TicketStatus.Resolved)
            {
                var responsible = ticket.AssignedToId.HasValue ? await _unitOfWork.Repository<User>().GetByIdAsync(ticket.AssignedToId.Value) : null;
                if (responsible is null || !responsible.IsActive || responsible.IsDeleted || responsible.Role != Domain.Enums.UserRole.Agent) ticket.AssignedToId = null;
                ticket.Status = ticket.AssignedToId.HasValue ? Domain.Enums.TicketStatus.InProgress : Domain.Enums.TicketStatus.Open;
                ticket.Resolution = null; ticket.ResolvedAt = null;
            }
            ticket.Version++;
            await _unitOfWork.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Realtime });
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
                var attachments = selectedAttachments;
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

            await _unitOfWork.Repository<TicketJob>().AddAsync(new TicketJob { TicketId = ticket.Id, Kind = TicketJobKind.Notification, RecipientId = actor.Role == Domain.Enums.UserRole.Customer || request.IsInternalNote ? null : ticket.CreatedById,
                Title = "New message", Message = "A new message is available on the ticket.", MessageId = message.Id.ToString() });
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var userRepo = _unitOfWork.Repository<User>();
            var sender = await userRepo.GetByIdAsync(request.SenderId);

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
