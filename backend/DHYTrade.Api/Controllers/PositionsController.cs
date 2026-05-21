using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PositionsController : ControllerBase
{
    private readonly PositionService _positionService;
    private readonly AppDbContext _db;
    private readonly IQuoteProvider _quote;

    public PositionsController(PositionService positionService, AppDbContext db, IQuoteProvider quote)
    {
        _positionService = positionService;
        _db = db;
        _quote = quote;
    }

    [HttpGet]
    public async Task<IActionResult> GetPositions()
    {
        return Ok(await _positionService.GetActivePositionsAsync());
    }

    [HttpGet("closed")]
    public async Task<IActionResult> GetClosed()
    {
        return Ok(await _positionService.GetClosedPositionsAsync());
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshPrices()
    {
        var positions = await _db.Positions
            .Where(p => p.IsActive && p.Shares > 0)
            .ToListAsync();

        if (!positions.Any())
            return Ok(new { message = "没有活跃持仓", updated = 0 });

        var stockCodes = positions.Select(p => p.StockCode).ToList();
        var quotes = await _quote.GetQuotesAsync(stockCodes);
        var count = 0;

        foreach (var pos in positions)
        {
            // Match by removing sh/sz prefix from both sides
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
                count++;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = $"已刷新 {count} 只股票", updated = count, codes = stockCodes, quoteCount = quotes.Count });
    }
}
