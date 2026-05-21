using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Services;

public class HistoryService
{
    private readonly AppDbContext _db;

    public HistoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<StockPnlSummary>> GetAllStocksPnlAsync()
    {
        var stockCodes = await _db.TradeRecords
            .Select(t => t.StockCode)
            .Distinct()
            .ToListAsync();

        var results = new List<StockPnlSummary>();
        foreach (var code in stockCodes)
        {
            var summary = await CalculateStockPnlAsync(code);
            if (summary != null) results.Add(summary);
        }

        return results.OrderByDescending(r => r.TotalRealizedPnl).ToList();
    }

    public async Task<StockPnlDetail?> GetStockPnlDetailAsync(string stockCode)
    {
        var summary = await CalculateStockPnlAsync(stockCode);
        if (summary == null) return null;

        var trades = await _db.TradeRecords
            .Where(t => t.StockCode == stockCode)
            .Include(t => t.Operator)
            .OrderBy(t => t.TradedAt)
            .ToListAsync();

        var pnlItems = new List<PnlItem>();
        var buyQueue = new Queue<(DateTime date, int shares, decimal cost)>();

        foreach (var trade in trades)
        {
            if (trade.Type == TradeType.Buy)
            {
                buyQueue.Enqueue((trade.TradedAt, trade.Shares, trade.TotalCost));
            }
            else
            {
                var remainingShares = trade.Shares;
                var sellRevenue = trade.TotalCost;
                var matchedCost = 0m;
                var matchedBuys = new List<MatchedBuy>();

                while (remainingShares > 0 && buyQueue.Count > 0)
                {
                    var (boughtAt, buyShares, buyCost) = buyQueue.Peek();
                    var matchShares = Math.Min(remainingShares, buyShares);
                    var matchCost = buyCost / buyShares * matchShares;

                    matchedBuys.Add(new MatchedBuy(
                        boughtAt, matchShares, matchCost / matchShares));
                    matchedCost += matchCost;
                    remainingShares -= matchShares;

                    if (matchShares >= buyShares)
                        buyQueue.Dequeue();
                }

                var pnl = sellRevenue - matchedCost;
                pnlItems.Add(new PnlItem(
                    trade.Id, trade.TradedAt, trade.Shares, trade.Price,
                    trade.TotalCost, matchedCost, pnl, matchedBuys
                ));
            }
        }

        return new StockPnlDetail(
            stockCode,
            trades.FirstOrDefault()?.StockName ?? stockCode,
            summary.TotalRealizedPnl,
            summary.TotalBuyAmount,
            summary.TotalSellAmount,
            summary.TradeCount,
            pnlItems
        );
    }

    private async Task<StockPnlSummary?> CalculateStockPnlAsync(string stockCode)
    {
        var trades = await _db.TradeRecords
            .Where(t => t.StockCode == stockCode)
            .OrderBy(t => t.TradedAt)
            .ToListAsync();

        if (!trades.Any()) return null;

        var buyTrades = trades.Where(t => t.Type == TradeType.Buy).ToList();
        var sellTrades = trades.Where(t => t.Type == TradeType.Sell).ToList();

        var totalBuyAmount = buyTrades.Sum(t => t.TotalCost);
        var totalSellAmount = sellTrades.Sum(t => t.TotalCost);

        var realizedPnl = 0m;
        var buyQueue = new Queue<(int shares, decimal cost)>();
        foreach (var t in buyTrades)
            buyQueue.Enqueue((t.Shares, t.TotalCost));

        foreach (var sell in sellTrades)
        {
            var remaining = sell.Shares;
            var revenue = sell.TotalCost;
            var matchedCost = 0m;

            while (remaining > 0 && buyQueue.Count > 0)
            {
                var (bs, bc) = buyQueue.Peek();
                var match = Math.Min(remaining, bs);
                matchedCost += bc / bs * match;
                remaining -= match;

                if (match >= bs) buyQueue.Dequeue();
            }

            realizedPnl += revenue - matchedCost;
        }

        return new StockPnlSummary(
            stockCode,
            trades.First().StockName,
            realizedPnl,
            totalBuyAmount,
            totalSellAmount,
            trades.Count
        );
    }
}

public record StockPnlSummary(
    string StockCode, string StockName,
    decimal TotalRealizedPnl, decimal TotalBuyAmount,
    decimal TotalSellAmount, int TradeCount
);

public record StockPnlDetail(
    string StockCode, string StockName,
    decimal TotalRealizedPnl, decimal TotalBuyAmount,
    decimal TotalSellAmount, int TradeCount,
    List<PnlItem> PnlItems
);

public record PnlItem(
    Guid TradeId, DateTime TradedAt, int Shares,
    decimal Price, decimal Revenue, decimal MatchedCost,
    decimal Pnl, List<MatchedBuy> MatchedBuys
);

public record MatchedBuy(
    DateTime BoughtAt, int Shares, decimal AvgCost
);
