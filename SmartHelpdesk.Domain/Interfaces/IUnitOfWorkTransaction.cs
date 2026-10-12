namespace SmartHelpdesk.Domain.Interfaces;
public interface IUnitOfWorkTransaction : IAsyncDisposable { Task CommitAsync(CancellationToken token = default); }
