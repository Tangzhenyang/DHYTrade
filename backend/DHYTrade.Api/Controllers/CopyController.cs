using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
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
        var positions = await _db.Positions
            .Where(p => p.IsActive && p.Shares > 0)
            .ToListAsync();

        if (!positions.Any())
            return BadRequest(new { message = "当前没有持仓" });

        var totalCost = positions.Sum(p => p.TotalCost);
        var stockCodes = positions.Select(p => p.StockCode).ToList();
        var quotes = await _quote.GetQuotesAsync(stockCodes);

        var results = new List<CopyResultItem>();
        foreach (var pos in positions)
        {
            var quote = quotes.FirstOrDefault(q => q.StockCode == pos.StockCode);
            var price = quote?.CurrentPrice ?? pos.CurrentPrice;
            var ratio = pos.TotalCost / totalCost;
            var targetAmount = request.OwnCapital * ratio;
            var suggestLots = (int)Math.Floor(targetAmount / price / 100);
            var actualAmount = suggestLots * 100 * price;

            results.Add(new CopyResultItem(
                pos.StockCode, pos.StockName, ratio,
                targetAmount, price, suggestLots, actualAmount
            ));
        }

        return Ok(new
        {
            totalCapital = request.OwnCapital,
            totalActualAmount = results.Sum(r => r.ActualAmount),
            items = results.OrderByDescending(r => r.TargetRatio).ToList()
        });
    }
}
