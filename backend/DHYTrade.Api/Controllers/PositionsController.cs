using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.Entities;
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
    private readonly IExchangeRateService _exchangeRateService;

    public PositionsController(PositionService positionService, AppDbContext db, IQuoteProvider quote, IExchangeRateService exchangeRateService)
    {
        _positionService = positionService;
        _db = db;
        _quote = quote;
        _exchangeRateService = exchangeRateService;
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

    [HttpGet("exchange-rate")]
    public async Task<IActionResult> GetExchangeRate()
    {
        try
        {
            var exchangeRate = await _exchangeRateService.GetHkdToCnyRateAsync();
            return Ok(exchangeRate);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshPrices()
    {
        ExchangeRateResult? exchangeRate = null;
        try
        {
            exchangeRate = await _exchangeRateService.GetHkdToCnyRateAsync();
        }
        catch
        {
            exchangeRate = null;
        }

        var positions = await _db.Positions
            .Where(p => p.IsActive && p.Shares > 0)
            .ToListAsync();

        if (!positions.Any())
            return Ok(new { message = "没有活跃持仓，汇率已刷新", updated = 0, exchangeRate });

        var stockCodes = positions.Select(p => p.StockCode).ToList();
        var quotes = await _quote.GetQuotesAsync(stockCodes);
        var count = 0;

        foreach (var pos in positions)
        {
            var matchedQuote = quotes.FirstOrDefault(q =>
                q.StockCode.NormalizeStockCode() == pos.StockCode.NormalizeStockCode());

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
        return Ok(new { message = $"已刷新 {count} 只股票，汇率已同步", updated = count, codes = stockCodes, quoteCount = quotes.Count, exchangeRate });
    }
}
