using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;
using DHYTrade.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace DHYTrade.Api.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_StoresRefreshTokenAndExpiry()
    {
        await using var db = CreateDbContext();
        db.Users.Add(new User
        {
            Username = "admin",
            Email = "admin@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = UserRole.SuperAdmin
        });
        await db.SaveChangesAsync();

        var service = new AuthService(db, CreateConfig());

        var result = await service.LoginAsync(new LoginRequest("admin", "admin123"));

        Assert.NotNull(result);
        var user = await db.Users.SingleAsync(u => u.Username == "admin");
        Assert.False(string.IsNullOrWhiteSpace(user.RefreshToken));
        Assert.Equal(result!.RefreshToken, user.RefreshToken);
        Assert.True(user.RefreshTokenExpiresAt > DateTime.UtcNow.AddDays(29));
    }

    [Fact]
    public async Task RefreshAsync_WithValidRefreshToken_RotatesTokens()
    {
        await using var db = CreateDbContext();
        var user = new User
        {
            Username = "user",
            Email = "user@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            RefreshToken = "old-token",
            RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(1)
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new AuthService(db, CreateConfig());

        var result = await service.RefreshAsync(new RefreshRequest("old-token"));

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result!.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(result.RefreshToken));
        Assert.NotEqual("old-token", result.RefreshToken);

        var saved = await db.Users.SingleAsync(u => u.Username == "user");
        Assert.Equal(result.RefreshToken, saved.RefreshToken);
        Assert.True(saved.RefreshTokenExpiresAt > DateTime.UtcNow.AddDays(29));
    }

    [Fact]
    public async Task RefreshAsync_WithExpiredRefreshToken_ReturnsNull()
    {
        await using var db = CreateDbContext();
        db.Users.Add(new User
        {
            Username = "user",
            Email = "user@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            RefreshToken = "expired-token",
            RefreshTokenExpiresAt = DateTime.UtcNow.AddMinutes(-1)
        });
        await db.SaveChangesAsync();

        var service = new AuthService(db, CreateConfig());

        var result = await service.RefreshAsync(new RefreshRequest("expired-token"));

        Assert.Null(result);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static IConfiguration CreateConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "Test-Secret-For-DHYTrade-At-Least-32-Chars",
                ["Jwt:Issuer"] = "DHYTrade.Tests",
                ["Jwt:AccessTokenExpiryMinutes"] = "60",
                ["Jwt:RefreshTokenExpiryDays"] = "30"
            })
            .Build();
}
