using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/history")]
[Authorize]
public class HistoryController : ControllerBase
{
    private readonly HistoryService _history;

    public HistoryController(HistoryService history)
    {
        _history = history;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllStocksPnl()
    {
        return Ok(await _history.GetAllStocksPnlAsync());
    }

    [HttpGet("{stockCode}")]
    public async Task<IActionResult> GetStockDetail(string stockCode)
    {
        var detail = await _history.GetStockPnlDetailAsync(stockCode);
        if (detail == null) return NotFound();
        return Ok(detail);
    }
}
