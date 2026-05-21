using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;

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

        var config = await _db.SystemConfigs.FindAsync("BaseCapital");
        var baseCapital = config != null && decimal.TryParse(config.Value, out var v) ? v : positions.Sum(p => p.TotalCost);

        return positions.Select(p => new PositionDto(
            p.Id, p.StockCode, p.StockName,
            p.Shares, p.TotalCost, p.AvgCost,
            p.CurrentPrice, p.MarketValue,
            p.UnrealizedPnl, p.UnrealizedPnlPct,
            baseCapital > 0 ? p.TotalCost / baseCapital * 100 : 0,
            p.HoldDays, p.FirstBoughtAt, p.LastTradedAt,
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
            p.Id, p.StockCode, p.StockName,
            0, 0, 0, 0, 0, 0, 0, 0,
            p.HoldDays, p.FirstBoughtAt, p.LastTradedAt,
            false
        )).ToList();
    }
}
