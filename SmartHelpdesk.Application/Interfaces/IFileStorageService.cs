using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace SmartHelpdesk.Application.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);
        Task DeleteFileAsync(string filePath);
    }
}
