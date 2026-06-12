using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using SmartHelpdesk.Application.Features.Attachments.DTOs;
using SmartHelpdesk.Application.Interfaces;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Application.Features.Attachments.Commands.UploadAttachment
{
    public class UploadAttachmentCommandHandler : IRequestHandler<UploadAttachmentCommand, AttachmentDto>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _fileStorageService;

        public UploadAttachmentCommandHandler(IUnitOfWork unitOfWork, IFileStorageService fileStorageService)
        {
            _unitOfWork = unitOfWork;
            _fileStorageService = fileStorageService;
        }

        public async Task<AttachmentDto> Handle(UploadAttachmentCommand request, CancellationToken cancellationToken)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf", ".docx" };
            var extension = Path.GetExtension(request.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                throw new Exception($"Định dạng file {extension} không được hỗ trợ.");
            }

            if (request.FileSize > 5 * 1024 * 1024)
            {
                throw new Exception("Kích thước file không được vượt quá 5MB.");
            }

            var filePath = await _fileStorageService.SaveFileAsync(request.FileStream, request.FileName, cancellationToken);

            var attachment = new Attachment
            {
                Id = Guid.NewGuid(),
                FileName = request.FileName,
                FilePath = filePath,
                FileSize = request.FileSize,
                ContentType = request.ContentType,
                TicketId = request.TicketId,
                TicketMessageId = request.TicketMessageId,
                UploadedById = request.UploadedById,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Attachment>().AddAsync(attachment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new AttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                FileSize = attachment.FileSize,
                ContentType = attachment.ContentType,
                TicketId = attachment.TicketId,
                TicketMessageId = attachment.TicketMessageId,
                UploadedById = attachment.UploadedById,
                CreatedAt = attachment.CreatedAt
            };
        }
    }
}
