using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using SmartHelpdesk.Application.Interfaces;

namespace SmartHelpdesk.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _uploadFolder;

        public LocalFileStorageService()
        {
            _uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(_uploadFolder))
            {
                Directory.CreateDirectory(_uploadFolder);
            }
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
        {
            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
            var filePath = Path.Combine(_uploadFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(stream, cancellationToken);
            }

            return $"/uploads/{uniqueFileName}";
        }

        public Task DeleteFileAsync(string filePath)
        {
            var fileName = Path.GetFileName(filePath);
            var absolutePath = Path.Combine(_uploadFolder, fileName);
            if (File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
            }
            return Task.CompletedTask;
        }
    }
}
