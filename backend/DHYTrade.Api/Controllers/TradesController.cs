using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Services;
using System.Security.Claims;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TradesController : ControllerBase
{
    private readonly TradeService _tradeService;

    public TradesController(TradeService tradeService)
    {
        _tradeService = tradeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTrades(
        [FromQuery] string? stockCode,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1)
    {
        var trades = await _tradeService.GetTradesAsync(stockCode, from, to, page);
        return Ok(trades);
    }

    [HttpPost]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> AddTrade([FromBody] AddTradeRequest request)
    {
        var operatorId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var trade = await _tradeService.AddTradeAsync(request, operatorId);
            return Ok(trade);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> UpdateTrade(Guid id, [FromBody] UpdateTradeRequest request)
    {
        try
        {
            var trade = await _tradeService.UpdateTradeAsync(id, request);
            return Ok(trade);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> DeleteTrade(Guid id)
    {
        var result = await _tradeService.DeleteTradeAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
