using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.Entities;
using System.Security.Claims;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SuperAdmin")]
public class InvitesController : ControllerBase
{
    private readonly AppDbContext _db;

    public InvitesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvites()
    {
        var invites = await _db.InviteCodes
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                i.Id, i.Code, i.IsUsed,
                i.UsedBy, i.ExpiresAt, i.CreatedAt
            })
            .ToListAsync();

        return Ok(invites);
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvite([FromBody] CreateInviteRequest? request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var code = Guid.NewGuid().ToString("N")[..8].ToUpper();

        var invite = new InviteCode
        {
            Code = code,
            CreatedBy = userId,
            ExpiresAt = request?.ExpiresAt
        };

        _db.InviteCodes.Add(invite);
        await _db.SaveChangesAsync();

        return Ok(invite);
    }
}

public record CreateInviteRequest(DateTime? ExpiresAt);
