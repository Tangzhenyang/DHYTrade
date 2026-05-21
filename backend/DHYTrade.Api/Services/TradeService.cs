using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Services;

public class TradeService
{
    private readonly AppDbContext _db;
    private readonly IQuoteProvider _quote;

    public TradeService(AppDbContext db, IQuoteProvider quote)
    {
        _db = db;
        _quote = quote;
    }

    public async Task<TradeRecordDto> AddTradeAsync(AddTradeRequest request, Guid operatorId)
    {
        decimal price;
        string stockName;

        if (request.Price.HasValue && request.Price.Value > 0)
        {
            price = request.Price.Value;
            stockName = request.StockName;
        }
        else
        {
            var quote = await _quote.GetQuoteAsync(request.StockCode);
            if (quote == null)
                throw new InvalidOperationException($"无法获取 {request.StockCode} 的实时行情，请手动输入成本价");
            price = quote.CurrentPrice;
            stockName = quote.StockName;
        }

        var shares = request.Lots * 100;
        var amount = shares * price;
        var commission = Math.Max(amount * 0.0001m, 5.00m);
        var totalCost = request.Type == "Buy"
            ? amount + commission
            : amount - commission;

        var trade = new TradeRecord
        {
            StockCode = request.StockCode,
            StockName = stockName,
            Type = request.Type == "Buy" ? TradeType.Buy : TradeType.Sell,
            Lots = request.Lots,
            Shares = shares,
            Price = price,
            Amount = amount,
            Commission = commission,
            TotalCost = totalCost,
            OperatorId = operatorId,
            Note = request.Note,
            TradedAt = request.TradedAt ?? DateTime.UtcNow
        };

        _db.TradeRecords.Add(trade);
        await UpdatePositionAsync(request.StockCode, stockName, trade);
        await _db.SaveChangesAsync();

        return MapTradeDto(trade);
    }

    private async Task UpdatePositionAsync(string stockCode, string stockName, TradeRecord trade)
    {
        var position = await _db.Positions
            .FirstOrDefaultAsync(p => p.StockCode == stockCode);

        if (position == null)
        {
            position = new Position
            {
                StockCode = stockCode,
                StockName = stockName,
                FirstBoughtAt = trade.TradedAt
            };
            _db.Positions.Add(position);
        }

        if (trade.Type == TradeType.Buy)
        {
            position.TotalCost += trade.TotalCost;
            position.Shares += trade.Shares;
        }
        else
        {
            var exitCost = trade.Shares * position.AvgCost;
            position.TotalCost -= exitCost;
            position.Shares -= trade.Shares;
        }

        position.AvgCost = position.Shares > 0
            ? position.TotalCost / position.Shares : 0;

        // Fetch latest market price from API
        try
        {
            var latestQuote = await _quote.GetQuoteAsync(stockCode);
            if (latestQuote != null)
            {
                position.CurrentPrice = latestQuote.CurrentPrice;
            }
            else if (position.CurrentPrice == 0)
            {
                position.CurrentPrice = trade.Price;
            }
        }
        catch
        {
            if (position.CurrentPrice == 0)
                position.CurrentPrice = trade.Price;
        }

        position.MarketValue = position.Shares * position.CurrentPrice;
        position.UnrealizedPnl = position.MarketValue - position.TotalCost;
        position.UnrealizedPnlPct = position.TotalCost > 0
            ? position.UnrealizedPnl / position.TotalCost : 0;
        position.LastTradedAt = trade.TradedAt;
        position.HoldDays = position.FirstBoughtAt.HasValue
            ? (int)(DateTime.UtcNow - position.FirstBoughtAt.Value).TotalDays : 0;
        position.IsActive = position.Shares > 0;
        position.UpdatedAt = DateTime.UtcNow;
    }

    public async Task<bool> DeleteTradeAsync(Guid tradeId)
    {
        var trade = await _db.TradeRecords.FindAsync(tradeId);
        if (trade == null) return false;

        var position = await _db.Positions
            .FirstOrDefaultAsync(p => p.StockCode == trade.StockCode);

        if (position != null)
        {
            if (trade.Type == TradeType.Buy)
            {
                position.TotalCost -= trade.TotalCost;
                position.Shares -= trade.Shares;
            }
            else
            {
                position.TotalCost += trade.Shares * position.AvgCost;
                position.Shares += trade.Shares;
            }

            position.AvgCost = position.Shares > 0
                ? position.TotalCost / position.Shares : 0;
            position.MarketValue = position.Shares * position.CurrentPrice;
            position.UnrealizedPnl = position.MarketValue - position.TotalCost;
            position.UnrealizedPnlPct = position.TotalCost > 0
                ? position.UnrealizedPnl / position.TotalCost : 0;
            position.IsActive = position.Shares > 0;
            position.UpdatedAt = DateTime.UtcNow;
        }

        _db.TradeRecords.Remove(trade);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<TradeRecordDto>> GetTradesAsync(
        string? stockCode, DateTime? from, DateTime? to, int page = 1, int pageSize = 20)
    {
        var query = _db.TradeRecords.AsQueryable();

        if (!string.IsNullOrEmpty(stockCode))
            query = query.Where(t => t.StockCode == stockCode);
        if (from.HasValue)
            query = query.Where(t => t.TradedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(t => t.TradedAt <= to.Value);

        return await query
            .OrderByDescending(t => t.TradedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(t => t.Operator)
            .Select(t => MapTradeDto(t))
            .ToListAsync();
    }

    private static TradeRecordDto MapTradeDto(TradeRecord t) => new(
        t.Id, t.StockCode, t.StockName,
        t.Type == TradeType.Buy ? "Buy" : "Sell",
        t.Lots, t.Shares, t.Price, t.Amount, t.Commission, t.TotalCost,
        t.Operator != null ? t.Operator.Username : null, t.Note, t.TradedAt, t.CreatedAt
    );
}
