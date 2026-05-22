using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Services;

public class PositionService
{
    private readonly AppDbContext _db;

    public PositionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PositionDto>> GetActivePositionsAsync()
    {
        var positions = await _db.Positions
            .Where(p => p.IsActive)
            .ToListAsync();

        var configs = await _db.SystemConfigs
            .ToDictionaryAsync(c => c.Key, c => c.Value);

        return positions.Select(p => new PositionDto(
            p.Id, p.MarketType.ToString(), p.StockCode, p.StockName,
            p.Shares, p.TotalCost, p.AvgCost,
            p.CurrentPrice, p.MarketValue,
            p.UnrealizedPnl, p.UnrealizedPnlPct,
            GetBaseCapital(p.MarketType, configs, positions) > 0 ? p.TotalCost / GetBaseCapital(p.MarketType, configs, positions) * 100 : 0,
            CalculateHoldDays(p.FirstBoughtAt), p.FirstBoughtAt, p.LastTradedAt,
            p.IsActive
        )).OrderByDescending(p => p.RatioPct).ToList();
    }

    public async Task<List<PositionDto>> GetClosedPositionsAsync()
    {
        var positions = await _db.Positions
            .Where(p => !p.IsActive)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        return positions.Select(p => new PositionDto(
            p.Id, p.MarketType.ToString(), p.StockCode, p.StockName,
            0, 0, 0, 0, 0, 0, 0, 0,
            CalculateHoldDays(p.FirstBoughtAt, p.LastTradedAt), p.FirstBoughtAt, p.LastTradedAt,
            false
        )).ToList();
    }

    private static decimal GetBaseCapital(MarketType marketType, IReadOnlyDictionary<string, string> configs, IEnumerable<Position> positions)
    {
        var key = marketType.GetBaseCapitalKey();
        if (configs.TryGetValue(key, out var configuredValue) && decimal.TryParse(configuredValue, out var parsedValue))
            return parsedValue;

        if (marketType == MarketType.AShare && configs.TryGetValue("BaseCapital", out var legacyValue) && decimal.TryParse(legacyValue, out parsedValue))
            return parsedValue;

        return positions.Where(p => p.MarketType == marketType).Sum(p => p.TotalCost);
    }

    private static int CalculateHoldDays(DateTime? firstBoughtAt, DateTime? endAt = null)
    {
        if (!firstBoughtAt.HasValue)
            return 0;

        var endDate = (endAt ?? DateTime.UtcNow).Date;
        var startDate = firstBoughtAt.Value.Date;

        return Math.Max(0, (endDate - startDate).Days);
    }
}
