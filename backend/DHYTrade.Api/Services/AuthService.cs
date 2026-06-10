using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.Username == request.Username && u.IsActive);

        if (user == null) return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = HashRefreshToken(refreshToken);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpiryDays());
        await _db.SaveChangesAsync();

        return new AuthResponse(accessToken, refreshToken, MapUserDto(user));
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshRequest request)
    {
        var refreshTokenHash = HashRefreshToken(request.RefreshToken);
        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.RefreshToken == refreshTokenHash &&
            u.RefreshTokenExpiresAt > DateTime.UtcNow &&
            u.IsActive);

        if (user == null) return null;

        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = HashRefreshToken(refreshToken);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpiryDays());
        await _db.SaveChangesAsync();

        return new AuthResponse(accessToken, refreshToken, MapUserDto(user));
    }

    public async Task<UserDto?> RegisterAsync(RegisterRequest request)
    {
        var inviteCode = await _db.InviteCodes.FirstOrDefaultAsync(i =>
            i.Code == request.InviteCode && !i.IsUsed &&
            (i.ExpiresAt == null || i.ExpiresAt > DateTime.UtcNow));

        if (inviteCode == null) return null;

        if (await _db.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email))
            return null;

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            InviteCode = request.InviteCode
        };

        inviteCode.IsUsed = true;
        inviteCode.UsedBy = user.Id;

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return MapUserDto(user);
    }

    public string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                double.Parse(_config["Jwt:AccessTokenExpiryMinutes"]!)),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }

    private static string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToBase64String(bytes);
    }

    private double GetRefreshTokenExpiryDays()
    {
        return double.Parse(_config["Jwt:RefreshTokenExpiryDays"]!);
    }

    private static UserDto MapUserDto(User u) => new(
        u.Id, u.Username, u.Email, u.Role.ToString(), u.IsActive, u.CreatedAt
    );
}
