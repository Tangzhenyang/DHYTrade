using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;

namespace DHYTrade.Api.Services;

public class QuoteRefreshService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<QuoteRefreshService> _logger;

    public QuoteRefreshService(IServiceProvider services, ILogger<QuoteRefreshService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var quote = scope.ServiceProvider.GetRequiredService<IQuoteProvider>();

                var stockCodes = await db.Positions
                    .Where(p => p.IsActive && p.Shares > 0)
                    .Select(p => p.StockCode)
                    .ToListAsync(stoppingToken);

                if (stockCodes.Any())
                {
                    var positions = await db.Positions
                        .Where(p => p.IsActive && p.Shares > 0)
                        .ToListAsync(stoppingToken);

                    var quotes = await quote.GetQuotesAsync(stockCodes);
                    foreach (var pos in positions)
                    {
                        var matchedQuote = quotes.FirstOrDefault(q =>
                        {
                            var qCode = q.StockCode.Replace("sh", "").Replace("sz", "");
                            var pCode = pos.StockCode.Replace("sh", "").Replace("sz", "");
                            return qCode == pCode;
                        });

                        if (matchedQuote != null)
                        {
                            pos.CurrentPrice = matchedQuote.CurrentPrice;
                            pos.StockName = matchedQuote.StockName;
                            pos.MarketValue = pos.Shares * matchedQuote.CurrentPrice;
                            pos.UnrealizedPnl = pos.MarketValue - pos.TotalCost;
                            pos.UnrealizedPnlPct = pos.TotalCost > 0
                                ? pos.UnrealizedPnl / pos.TotalCost : 0;
                            pos.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "行情刷新失败");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
