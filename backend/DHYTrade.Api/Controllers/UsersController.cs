using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SuperAdmin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto(
                u.Id, u.Username, u.Email,
                u.Role.ToString(), u.IsActive, u.CreatedAt
            ))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Role = Enum.Parse<UserRole>(request.Role);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/active")]
    public async Task<IActionResult> ToggleActive(Guid id, [FromBody] ToggleActiveRequest request)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = request.IsActive;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record UpdateRoleRequest(string Role);
public record ToggleActiveRequest(bool IsActive);
