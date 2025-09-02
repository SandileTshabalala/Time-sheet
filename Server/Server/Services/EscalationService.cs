using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Server.DataBase;
using Server.Hubs;

namespace Server.Services
{
    public class EscalationService : BackgroundService
    {
        private readonly ILogger<EscalationService> _logger;
        private readonly IServiceProvider _services;
        private readonly IHubContext<NotificationsHub> _hub;
        private readonly IMemoryCache _cache;

        public EscalationService(ILogger<EscalationService> logger, IServiceProvider services, IHubContext<NotificationsHub> hub, IMemoryCache cache)
        {
            _logger = logger;
            _services = services;
            _hub = hub;
            _cache = cache;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Run every hour
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckPendingEscalationsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "EscalationService run failed");
                }
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private async Task CheckPendingEscalationsAsync(CancellationToken ct)
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDBContext>();

            var threshold = DateTime.UtcNow.AddDays(-7);
            var pending = await db.Timesheets
                .AsNoTracking()
                .Where(t => t.Status == Models.TimesheetStatus.Submitted && t.CreatedDate <= threshold)
                .Select(t => new { t.Id, t.EmployeeId, t.CreatedDate })
                .ToListAsync(ct);

            foreach (var t in pending)
            {
                var cacheKey = $"escalation:sent:{t.Id}:{DateTime.UtcNow:yyyyMMdd}"; // send at most once per day per timesheet
                if (_cache.TryGetValue(cacheKey, out _))
                    continue;

                var days = (int)Math.Floor((DateTime.UtcNow - t.CreatedDate).TotalDays);
                try
                {
                    await _hub.Clients.Groups("HRAdmin", "SystemAdmin").SendAsync(
                        "TimesheetEscalation",
                        new { timesheetId = t.Id, employeeId = t.EmployeeId, daysPending = days },
                        ct
                    );
                    _cache.Set(cacheKey, true, new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1)
                    });
                }
                catch { }
            }
        }
    }
}
