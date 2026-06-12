using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Features.Messages.Commands.AddMessage;
using SmartHelpdesk.Application.Features.Messages.DTOs;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Messages.Commands.AddMessage
{
    public class AddMessageCommandHandler : IRequestHandler<AddMessageCommand, TicketMessageDto>
    {
        private readonly IUnitOfWork _unitOfWork;

        public AddMessageCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
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

            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
                CreatedAt = message.CreatedAt
            };
        }
    }
}
