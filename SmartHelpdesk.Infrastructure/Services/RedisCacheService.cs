using SmartHelpdesk.Application.Interfaces;
using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using SmartHelpdesk.Domain.Interfaces;

namespace SmartHelpdesk.Infrastructure.Services
{
    public class RedisCacheService : ICacheService
    {
        private readonly IDistributedCache _distributedCache;

        public RedisCacheService(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        {
            var cachedValue = await _distributedCache.GetStringAsync(key, cancellationToken);
            if (string.IsNullOrEmpty(cachedValue))
            {
                return default;
            }

            return JsonSerializer.Deserialize<T>(cachedValue);
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expirationTime = null, CancellationToken cancellationToken = default)
        {
            if (value == null) return;

            var serializedValue = JsonSerializer.Serialize(value);

            var options = new DistributedCacheEntryOptions();
            if (expirationTime.HasValue)
            {
                options.AbsoluteExpirationRelativeToNow = expirationTime.Value;
            }
            else
            {
                // Mặc định cache 1 tiếng nếu không truyền vào
                options.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            }

            await _distributedCache.SetStringAsync(key, serializedValue, options, cancellationToken);
        }

        public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        {
            await _distributedCache.RemoveAsync(key, cancellationToken);
        }
    }
}

