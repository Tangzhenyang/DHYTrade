using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;
using System.Security.Claims;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BulletinsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BulletinsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetBulletins()
    {
        var bulletins = await _db.Bulletins
            .Include(b => b.Author)
            .OrderByDescending(b => b.IsPinned)
            .ThenByDescending(b => b.CreatedAt)
            .Take(50)
            .Select(b => new BulletinDto(
                b.Id, b.Title, b.Content,
                b.Author!.Username,
                b.IsPinned, b.CreatedAt
            ))
            .ToListAsync();

        return Ok(bulletins);
    }

    [HttpPost]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> Create([FromBody] CreateBulletinRequest request)
    {
        var authorId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var bulletin = new Bulletin
        {
            Title = request.Title,
            Content = request.Content,
            AuthorId = authorId,
            IsPinned = request.IsPinned
        };

        _db.Bulletins.Add(bulletin);
        await _db.SaveChangesAsync();

        return Ok(new BulletinDto(
            bulletin.Id, bulletin.Title, bulletin.Content,
            User.FindFirstValue(ClaimTypes.Name)!,
            bulletin.IsPinned, bulletin.CreatedAt
        ));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateBulletinRequest request)
    {
        var bulletin = await _db.Bulletins.FindAsync(id);
        if (bulletin == null) return NotFound();

        bulletin.Title = request.Title;
        bulletin.Content = request.Content;
        bulletin.IsPinned = request.IsPinned;
        bulletin.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var bulletin = await _db.Bulletins.FindAsync(id);
        if (bulletin == null) return NotFound();

        _db.Bulletins.Remove(bulletin);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
