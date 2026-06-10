using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/copy")]
[Authorize]
public class CopyController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IQuoteProvider _quote;

    public CopyController(AppDbContext db, IQuoteProvider quote)
    {
        _db = db;
        _quote = quote;
    }

    [HttpPost("calculate")]
    public async Task<IActionResult> Calculate([FromBody] CopyCalculateRequest request)
    {
        if (!Enum.TryParse<Models.Entities.MarketType>(request.MarketType, true, out var marketType))
            return BadRequest(new { message = "无效的市场类型" });

        var positions = await _db.Positions
            .Where(p => p.IsActive && p.Shares > 0 && p.MarketType == marketType)
            .ToListAsync();

        if (!positions.Any())
            return BadRequest(new { message = "当前没有持仓" });

        var config = await _db.SystemConfigs.FindAsync(marketType.GetBaseCapitalKey());
        var baseCapital = config != null && decimal.TryParse(config.Value, out var v)
            ? v
            : marketType == Models.Entities.MarketType.AShare
                ? await GetLegacyOrCalculatedBaseCapitalAsync(positions)
                : positions.Sum(p => p.TotalCost);
        var stockCodes = positions.Select(p => p.StockCode).ToList();
        var quotes = await _quote.GetQuotesAsync(stockCodes);

        var results = new List<CopyResultItem>();
        foreach (var pos in positions)
        {
            var quote = quotes.FirstOrDefault(q => q.StockCode.NormalizeStockCode() == pos.StockCode.NormalizeStockCode());
            var price = quote?.CurrentPrice ?? pos.CurrentPrice;
            var ratio = pos.TotalCost / baseCapital;
            var targetAmount = request.OwnCapital * ratio;
            var lotCalculation = CopyLotCalculator.Calculate(request.OwnCapital, targetAmount, price);

            results.Add(new CopyResultItem(
                pos.StockCode, pos.StockName, ratio,
                targetAmount, price, lotCalculation.SuggestLots, lotCalculation.ActualAmount
            ));
        }

        return Ok(new
        {
            totalCapital = request.OwnCapital,
            totalActualAmount = results.Sum(r => r.ActualAmount),
            items = results.OrderByDescending(r => r.TargetRatio).ToList()
        });
    }

    private async Task<decimal> GetLegacyOrCalculatedBaseCapitalAsync(List<Models.Entities.Position> positions)
    {
        var legacyConfig = await _db.SystemConfigs.FindAsync("BaseCapital");
        if (legacyConfig != null && decimal.TryParse(legacyConfig.Value, out var legacyValue))
            return legacyValue;

        return positions.Sum(p => p.TotalCost);
    }
}
