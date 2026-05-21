using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PositionsController : ControllerBase
{
    private readonly PositionService _positionService;

    public PositionsController(PositionService positionService)
    {
        _positionService = positionService;
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
}
