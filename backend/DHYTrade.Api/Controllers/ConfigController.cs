using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfigController : ControllerBase
{
    private readonly AppDbContext _db;

    public ConfigController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var configs = await _db.SystemConfigs
            .Select(c => new { c.Key, c.Value })
            .ToListAsync();
        return Ok(configs);
    }

    [HttpPut("baseCapital")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> SetBaseCapital([FromBody] SetBaseCapitalRequest request)
    {
        var config = await _db.SystemConfigs.FindAsync("BaseCapital");
        if (config == null)
        {
            config = new Models.Entities.SystemConfig { Key = "BaseCapital" };
            _db.SystemConfigs.Add(config);
        }

        config.Value = request.Value.ToString();
        config.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { key = "BaseCapital", value = request.Value });
    }
}

public record SetBaseCapitalRequest(decimal Value);
