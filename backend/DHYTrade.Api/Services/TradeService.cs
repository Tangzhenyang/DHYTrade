using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Services;

public class TradeService
{
    private readonly AppDbContext _db;
    private readonly IQuoteProvider _quote;
    private const decimal DefaultTradeFeeRate = 0.0001m;
    private const decimal MinimumCommission = 5.00m;

    public TradeService(AppDbContext db, IQuoteProvider quote)
    {
        _db = db;
        _quote = quote;
    }

    public async Task<TradeRecordDto> AddTradeAsync(AddTradeRequest request, Guid operatorId)
    {
        var prepared = await PrepareTradeAsync(
            request.MarketType,
            request.StockCode,
            request.StockName,
            request.Type,
            request.Lots,
            request.Price,
            request.Note,
            request.TradedAt
        );

        var trade = new TradeRecord
        {
            MarketType = prepared.MarketType,
            StockCode = prepared.StockCode,
            StockName = prepared.StockName,
            Type = prepared.TradeType,
            Lots = prepared.Lots,
            Shares = prepared.Shares,
            Price = prepared.Price,
            Amount = prepared.Amount,
            Commission = prepared.Commission,
            TotalCost = prepared.TotalCost,
            OperatorId = operatorId,
            Note = prepared.Note,
            TradedAt = prepared.TradedAt
        };

        _db.TradeRecords.Add(trade);
        await _db.SaveChangesAsync();
        await RebuildPositionAsync(prepared.MarketType, prepared.StockCode);
        await _db.SaveChangesAsync();

        return await GetTradeDtoAsync(trade.Id);
    }

    public async Task<TradeRecordDto> UpdateTradeAsync(Guid tradeId, UpdateTradeRequest request)
    {
        var trade = await _db.TradeRecords.FindAsync(tradeId);
        if (trade == null)
            throw new KeyNotFoundException();

        var previousMarketType = trade.MarketType;
        var previousStockCode = trade.StockCode;

        var prepared = await PrepareTradeAsync(
            request.MarketType,
            request.StockCode,
            request.StockName,
            request.Type,
            request.Lots,
            request.Price,
            request.Note,
            request.TradedAt
        );

        trade.MarketType = prepared.MarketType;
        trade.StockCode = prepared.StockCode;
        trade.StockName = prepared.StockName;
        trade.Type = prepared.TradeType;
        trade.Lots = prepared.Lots;
        trade.Shares = prepared.Shares;
        trade.Price = prepared.Price;
        trade.Amount = prepared.Amount;
        trade.Commission = prepared.Commission;
        trade.TotalCost = prepared.TotalCost;
        trade.Note = prepared.Note;
        trade.TradedAt = prepared.TradedAt;

        await _db.SaveChangesAsync();

        if (previousMarketType != prepared.MarketType || previousStockCode != prepared.StockCode)
        {
            await RebuildPositionAsync(previousMarketType, previousStockCode);
        }

        await RebuildPositionAsync(prepared.MarketType, prepared.StockCode);
        await _db.SaveChangesAsync();

        return await GetTradeDtoAsync(trade.Id);
    }

    private async Task<TradeRecordDto> GetTradeDtoAsync(Guid tradeId)
    {
        var trade = await _db.TradeRecords
            .Include(t => t.Operator)
            .FirstAsync(t => t.Id == tradeId);

        return MapTradeDto(trade);
    }

    private async Task<PreparedTrade> PrepareTradeAsync(
        string marketTypeValue,
        string stockCodeValue,
        string? stockNameValue,
        string typeValue,
        int lots,
        decimal? priceValue,
        string? note,
        DateTime? tradedAt)
    {
        if (!Enum.TryParse<MarketType>(marketTypeValue, true, out var marketType))
            throw new InvalidOperationException("无效的市场类型");

        if (!Enum.TryParse<TradeType>(typeValue, true, out var tradeType))
            throw new InvalidOperationException("无效的交易方向");

        var stockCode = NormalizeStockCode(marketType, stockCodeValue);
        if (string.IsNullOrWhiteSpace(stockCode))
            throw new InvalidOperationException("股票代码不能为空");

        QuoteResult? quote = null;
        var stockName = stockNameValue?.Trim() ?? string.Empty;

        if (priceValue.GetValueOrDefault() <= 0 || string.IsNullOrWhiteSpace(stockName))
        {
            quote = await _quote.GetQuoteAsync(stockCode);
        }

        if (string.IsNullOrWhiteSpace(stockName))
        {
            if (quote == null)
                throw new InvalidOperationException($"无法获取 {stockCode} 的股票名称，请检查代码是否正确");

            stockName = quote.StockName;
        }

        decimal price;
        if (priceValue.HasValue && priceValue.Value > 0)
        {
            price = priceValue.Value;
        }
        else
        {
            if (quote == null)
                throw new InvalidOperationException($"无法获取 {stockCode} 的实时行情，请手动输入成本价");

            price = quote.CurrentPrice;
        }

        var shares = lots * 100;
        var amount = shares * price;
        var (tradeFeeRate, waiveMinimumCommission) = await GetTradeFeeSettingsAsync();
        var commission = amount * tradeFeeRate;
        if (!waiveMinimumCommission)
        {
            commission = Math.Max(commission, MinimumCommission);
        }

        var totalCost = tradeType == TradeType.Buy
            ? amount + commission
            : amount - commission;

        return new PreparedTrade(
            marketType,
            stockCode,
            stockName,
            tradeType,
            lots,
            shares,
            price,
            amount,
            commission,
            totalCost,
            note,
            tradedAt ?? DateTime.UtcNow
        );
    }

    private async Task RebuildPositionAsync(MarketType marketType, string stockCode)
    {
        var trades = await _db.TradeRecords
            .Where(t => t.MarketType == marketType && t.StockCode == stockCode)
            .OrderBy(t => t.TradedAt)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync();

        var position = await _db.Positions
            .FirstOrDefaultAsync(p => p.MarketType == marketType && p.StockCode == stockCode);

        if (!trades.Any())
        {
            if (position != null)
            {
                _db.Positions.Remove(position);
            }
            return;
        }

        if (position == null)
        {
            position = new Position
            {
                MarketType = marketType,
                StockCode = stockCode,
                CreatedAt = DateTime.UtcNow,
            };
            _db.Positions.Add(position);
        }

        var stockName = trades.Last().StockName;
        var totalCost = 0m;
        var shares = 0;
        DateTime? firstBoughtAt = null;
        var lastTradedAt = trades.Last().TradedAt;

        foreach (var trade in trades)
        {
            stockName = trade.StockName;

            if (trade.Type == TradeType.Buy)
            {
                if (!firstBoughtAt.HasValue)
                    firstBoughtAt = trade.TradedAt;

                totalCost += trade.TotalCost;
                shares += trade.Shares;
            }
            else
            {
                var avgCostBeforeSell = shares > 0 ? totalCost / shares : 0;
                totalCost -= trade.Shares * avgCostBeforeSell;
                shares -= trade.Shares;

                if (shares <= 0)
                {
                    shares = 0;
                    totalCost = 0;
                }
            }
        }

        decimal currentPrice;
        try
        {
            var latestQuote = await _quote.GetQuoteAsync(stockCode);
            currentPrice = latestQuote?.CurrentPrice ?? (shares > 0 ? trades.Last().Price : 0);
            if (latestQuote != null)
                stockName = latestQuote.StockName;
        }
        catch
        {
            currentPrice = shares > 0 ? trades.Last().Price : 0;
        }

        position.StockName = stockName;
        position.Shares = shares;
        position.TotalCost = totalCost;
        position.AvgCost = shares > 0 ? totalCost / shares : 0;
        position.CurrentPrice = currentPrice;
        position.MarketValue = shares * currentPrice;
        position.UnrealizedPnl = position.MarketValue - totalCost;
        position.UnrealizedPnlPct = totalCost > 0 ? position.UnrealizedPnl / totalCost : 0;
        position.FirstBoughtAt = firstBoughtAt;
        position.LastTradedAt = lastTradedAt;
        position.HoldDays = firstBoughtAt.HasValue
            ? (int)(DateTime.UtcNow - firstBoughtAt.Value).TotalDays : 0;
        position.IsActive = shares > 0;
        position.UpdatedAt = DateTime.UtcNow;
    }

    private static string NormalizeStockCode(MarketType marketType, string stockCode)
    {
        var normalized = stockCode.NormalizeStockCode();
        if (string.IsNullOrWhiteSpace(normalized))
            return string.Empty;

        if (marketType == MarketType.HongKong)
            return $"hk{normalized.PadLeft(5, '0')}";

        return normalized.StartsWith("6", StringComparison.Ordinal)
            ? $"sh{normalized}"
            : $"sz{normalized}";
    }

    private async Task<(decimal TradeFeeRate, bool WaiveMinimumCommission)> GetTradeFeeSettingsAsync()
    {
        var configs = await _db.SystemConfigs
            .Where(c => c.Key == "TradeFeeRate" || c.Key == "TradeFeeWaiveMinimum")
            .ToDictionaryAsync(c => c.Key, c => c.Value);

        var tradeFeeRate = DefaultTradeFeeRate;
        if (configs.TryGetValue("TradeFeeRate", out var rateValue) && decimal.TryParse(rateValue, out var parsedRate) && parsedRate >= 0)
        {
            tradeFeeRate = parsedRate;
        }

        var waiveMinimumCommission = false;
        if (configs.TryGetValue("TradeFeeWaiveMinimum", out var waiveValue) && bool.TryParse(waiveValue, out var parsedWaiveValue))
        {
            waiveMinimumCommission = parsedWaiveValue;
        }

        return (tradeFeeRate, waiveMinimumCommission);
    }

    public async Task<bool> DeleteTradeAsync(Guid tradeId)
    {
        var trade = await _db.TradeRecords.FindAsync(tradeId);
        if (trade == null) return false;

        var marketType = trade.MarketType;
        var stockCode = trade.StockCode;
        _db.TradeRecords.Remove(trade);
        await _db.SaveChangesAsync();

        await RebuildPositionAsync(marketType, stockCode);
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
        t.Id, t.MarketType.ToString(), t.StockCode, t.StockName,
        t.Type == TradeType.Buy ? "Buy" : "Sell",
        t.Lots, t.Shares, t.Price, t.Amount, t.Commission, t.TotalCost,
        t.Operator != null ? t.Operator.Username : null, t.Note, t.TradedAt, t.CreatedAt
    );

    private sealed record PreparedTrade(
        MarketType MarketType,
        string StockCode,
        string StockName,
        TradeType TradeType,
        int Lots,
        int Shares,
        decimal Price,
        decimal Amount,
        decimal Commission,
        decimal TotalCost,
        string? Note,
        DateTime TradedAt
    );
}
