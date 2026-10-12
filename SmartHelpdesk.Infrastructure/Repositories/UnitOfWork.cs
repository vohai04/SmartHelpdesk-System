using System;
using System.Collections.Generic;
using System.Threading;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Threading.Tasks;
using SmartHelpdesk.Domain.Interfaces;
using SmartHelpdesk.Infrastructure.Persistence;

namespace SmartHelpdesk.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private readonly Dictionary<Type, object> _repositories = new();

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public IGenericRepository<TEntity> Repository<TEntity>() where TEntity : class
        {
            var type = typeof(TEntity);

            if (!_repositories.ContainsKey(type))
            {
                var repositoryType = typeof(GenericRepository<>);
                var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(TEntity)), _context);
                if (repositoryInstance != null)
                {
                    _repositories[type] = repositoryInstance;
                }
            }

            return (IGenericRepository<TEntity>)_repositories[type];
        }

        public async Task<IUnitOfWorkTransaction> BeginTransactionAsync(CancellationToken token = default) => new Transaction(await _context.Database.BeginTransactionAsync(token));
        public async Task LockUsersAsync(IEnumerable<Guid> ids, CancellationToken token = default)
        {
            foreach (var id in ids.Distinct().OrderBy(id => id))
                await _context.Database.ExecuteSqlInterpolatedAsync($"SELECT 1 FROM \"Users\" WHERE \"Id\"={id} FOR UPDATE", token);
        }
        private sealed class Transaction(IDbContextTransaction transaction) : IUnitOfWorkTransaction
        {
            public Task CommitAsync(CancellationToken token = default) => transaction.CommitAsync(token);
            public ValueTask DisposeAsync() => transaction.DisposeAsync();
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
