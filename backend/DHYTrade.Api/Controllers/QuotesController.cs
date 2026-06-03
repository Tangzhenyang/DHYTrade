using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuotesController : ControllerBase
{
    private readonly IQuoteProvider _quote;

    public QuotesController(IQuoteProvider quote)
    {
        _quote = quote;
    }

    [HttpGet("{stockCode}")]
    public async Task<IActionResult> GetQuote(string stockCode)
    {
        var result = await _quote.GetQuoteAsync(stockCode);
        if (result == null)
            return NotFound(new { message = $"无法获取 {stockCode} 的行情" });
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchQuotes([FromQuery] string keyword, [FromQuery] string? marketType)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return Ok(Array.Empty<QuoteSearchResult>());

        var results = await _quote.SearchQuotesAsync(keyword);

        if (Enum.TryParse<MarketType>(marketType, true, out var parsedMarketType))
        {
            var expectedMarket = parsedMarketType.ToString();
            results = results
                .Where(result => string.Equals(result.MarketType, expectedMarket, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return Ok(results);
    }

    [HttpPost("batch")]
    public async Task<IActionResult> BatchQuote([FromBody] BatchQuoteRequest request)
    {
        var results = await _quote.GetQuotesAsync(request.StockCodes);
        return Ok(results);
    }
}
