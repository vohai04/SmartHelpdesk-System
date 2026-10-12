using System;
using System.Threading;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartHelpdesk.Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        Task<IUnitOfWorkTransaction> BeginTransactionAsync(CancellationToken token = default);
        Task LockUsersAsync(IEnumerable<Guid> ids, CancellationToken token = default);
        IGenericRepository<TEntity> Repository<TEntity>() where TEntity : class;
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
