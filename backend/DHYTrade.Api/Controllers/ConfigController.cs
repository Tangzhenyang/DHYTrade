using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfigController : ControllerBase
{
    private readonly AppDbContext _db;
    private const string TradeFeeRateKey = "TradeFeeRate";
    private const string TradeFeeWaiveMinimumKey = "TradeFeeWaiveMinimum";
    private const decimal DefaultTradeFeeRate = 0.0001m;

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

    [HttpGet("tradeFee")]
    public async Task<IActionResult> GetTradeFeeSettings()
    {
        var configs = await _db.SystemConfigs
            .Where(c => c.Key == TradeFeeRateKey || c.Key == TradeFeeWaiveMinimumKey)
            .ToDictionaryAsync(c => c.Key, c => c.Value);

        var rate = DefaultTradeFeeRate;
        if (configs.TryGetValue(TradeFeeRateKey, out var rateValue) && decimal.TryParse(rateValue, out var parsedRate) && parsedRate >= 0)
        {
            rate = parsedRate;
        }

        var waiveMinimumCommission = false;
        if (configs.TryGetValue(TradeFeeWaiveMinimumKey, out var waiveValue) && bool.TryParse(waiveValue, out var parsedWaiveValue))
        {
            waiveMinimumCommission = parsedWaiveValue;
        }

        return Ok(new TradeFeeSettingsResponse(rate * 10000m, waiveMinimumCommission));
    }

    [HttpPut("baseCapital")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> SetBaseCapital([FromBody] SetBaseCapitalRequest request)
    {
        if (!Enum.TryParse<Models.Entities.MarketType>(request.MarketType ?? nameof(Models.Entities.MarketType.AShare), true, out var marketType))
            return BadRequest(new { message = "无效的市场类型" });

        var key = marketType.GetBaseCapitalKey();
        var config = await _db.SystemConfigs.FindAsync(key);
        if (config == null)
        {
            config = new Models.Entities.SystemConfig { Key = key };
            _db.SystemConfigs.Add(config);
        }

        config.Value = request.Value.ToString();
        config.UpdatedAt = DateTime.UtcNow;

        if (marketType == Models.Entities.MarketType.AShare)
        {
            var legacyConfig = await _db.SystemConfigs.FindAsync("BaseCapital");
            if (legacyConfig == null)
            {
                legacyConfig = new Models.Entities.SystemConfig { Key = "BaseCapital" };
                _db.SystemConfigs.Add(legacyConfig);
            }

            legacyConfig.Value = request.Value.ToString();
            legacyConfig.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return Ok(new { key, marketType = marketType.ToString(), value = request.Value });
    }

    [HttpPut("tradeFee")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> SetTradeFeeSettings([FromBody] SetTradeFeeSettingsRequest request)
    {
        if (request.RatePerTenThousand < 0)
            return BadRequest(new { message = "手续费率不能小于 0" });

        await UpsertConfigAsync(TradeFeeRateKey, (request.RatePerTenThousand / 10000m).ToString());
        await UpsertConfigAsync(TradeFeeWaiveMinimumKey, request.WaiveMinimumCommission.ToString());
        await _db.SaveChangesAsync();

        return Ok(new TradeFeeSettingsResponse(request.RatePerTenThousand, request.WaiveMinimumCommission));
    }

    private async Task UpsertConfigAsync(string key, string value)
    {
        var config = await _db.SystemConfigs.FindAsync(key);
        if (config == null)
        {
            config = new Models.Entities.SystemConfig { Key = key };
            _db.SystemConfigs.Add(config);
        }

        config.Value = value;
        config.UpdatedAt = DateTime.UtcNow;
    }
}

public record SetBaseCapitalRequest(decimal Value, string? MarketType);
public record SetTradeFeeSettingsRequest(decimal RatePerTenThousand, bool WaiveMinimumCommission);
public record TradeFeeSettingsResponse(decimal RatePerTenThousand, bool WaiveMinimumCommission);
