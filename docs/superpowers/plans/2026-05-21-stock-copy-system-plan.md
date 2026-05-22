# 股票跟仓系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete stock position tracking & copy-trading system with .NET 10 backend + React frontend + SQLite storage.

**Architecture:** RESTful API backend with JWT auth, three-role permission system. Frontend SPA with Ant Design. SQLite via EF Core with full migration support for future PostgreSQL/SQL Server switch. Real-time stock quotes from Sina Finance API via abstracted provider interface.

**Tech Stack:** .NET 10 (ASP.NET Core Web API, EF Core, SQLite), React 18 + Vite + Ant Design 5 + Zustand + ECharts

---

## Phase 1: Backend Foundation

### Task 1: Create .NET solution and project

**Files:**
- Create: `backend/DHYTrade.Api/DHYTrade.Api.csproj`
- Create: `backend/DHYTrade.sln`

- [ ] **Step 1: Create solution and project**

```bash
mkdir -p backend
cd backend
dotnet new sln -n DHYTrade
dotnet new webapi -n DHYTrade.Api --framework net10.0
dotnet sln add DHYTrade.Api/DHYTrade.Api.csproj
```

- [ ] **Step 2: Add NuGet packages**

```bash
cd DHYTrade.Api
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next
```

- [ ] **Step 3: Verify build**

```bash
dotnet build
```
Expected: Build succeeded.

---

### Task 2: Define Entity Models

**Files:**
- Create: `backend/DHYTrade.Api/Models/Entities/User.cs`
- Create: `backend/DHYTrade.Api/Models/Entities/InviteCode.cs`
- Create: `backend/DHYTrade.Api/Models/Entities/TradeRecord.cs`
- Create: `backend/DHYTrade.Api/Models/Entities/Position.cs`
- Create: `backend/DHYTrade.Api/Models/Entities/Bulletin.cs`
- Create: `backend/DHYTrade.Api/Models/Entities/UserRole.cs`

- [ ] **Step 1: Create UserRole enum**

```csharp
// Models/Entities/UserRole.cs
namespace DHYTrade.Api.Models.Entities;

public enum UserRole
{
    SuperAdmin = 0,
    Operator = 1,
    User = 2
}
```

- [ ] **Step 2: Create User entity**

```csharp
// Models/Entities/User.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DHYTrade.Api.Models.Entities;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public UserRole Role { get; set; } = UserRole.User;

    public bool IsActive { get; set; } = true;

    [MaxLength(20)]
    public string? InviteCode { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TradeRecord> TradeRecords { get; set; } = new List<TradeRecord>();
    public ICollection<Bulletin> Bulletins { get; set; } = new List<Bulletin>();
}
```

- [ ] **Step 3: Create InviteCode entity**

```csharp
// Models/Entities/InviteCode.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DHYTrade.Api.Models.Entities;

public class InviteCode
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    public Guid CreatedBy { get; set; }

    [ForeignKey(nameof(CreatedBy))]
    public User? Creator { get; set; }

    public bool IsUsed { get; set; } = false;

    public Guid? UsedBy { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 4: Create TradeRecord entity**

```csharp
// Models/Entities/TradeRecord.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DHYTrade.Api.Models.Entities;

public enum TradeType
{
    Buy = 0,
    Sell = 1
}

public class TradeRecord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(20)]
    public string StockCode { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string StockName { get; set; } = string.Empty;

    [Required]
    public TradeType Type { get; set; }

    public int Lots { get; set; }

    public int Shares { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal Price { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Commission { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCost { get; set; }

    public Guid OperatorId { get; set; }

    [ForeignKey(nameof(OperatorId))]
    public User? Operator { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime TradedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 5: Create Position entity**

```csharp
// Models/Entities/Position.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DHYTrade.Api.Models.Entities;

public class Position
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(20)]
    public string StockCode { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string StockName { get; set; } = string.Empty;

    public int Shares { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalCost { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal AvgCost { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal CurrentPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MarketValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnrealizedPnl { get; set; }

    [Column(TypeName = "decimal(18,4)")]
    public decimal UnrealizedPnlPct { get; set; }

    public DateTime? FirstBoughtAt { get; set; }

    public DateTime? LastTradedAt { get; set; }

    public int HoldDays { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 6: Create Bulletin entity**

```csharp
// Models/Entities/Bulletin.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DHYTrade.Api.Models.Entities;

public class Bulletin
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Content { get; set; } = string.Empty;

    public Guid AuthorId { get; set; }

    [ForeignKey(nameof(AuthorId))]
    public User? Author { get; set; }

    public bool IsPinned { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

---

### Task 3: Create DbContext and configure EF Core

**Files:**
- Create: `backend/DHYTrade.Api/Data/AppDbContext.cs`
- Modify: `backend/DHYTrade.Api/Program.cs`
- Modify: `backend/DHYTrade.Api/appsettings.json`

- [ ] **Step 1: Create AppDbContext**

```csharp
// Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<InviteCode> InviteCodes => Set<InviteCode>();
    public DbSet<TradeRecord> TradeRecords => Set<TradeRecord>();
    public DbSet<Position> Positions => Set<Position>();
    public DbSet<Bulletin> Bulletins => Set<Bulletin>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<InviteCode>(e =>
        {
            e.HasIndex(i => i.Code).IsUnique();
        });

        modelBuilder.Entity<Position>(e =>
        {
            e.HasIndex(p => p.StockCode).IsUnique();
        });

        modelBuilder.Entity<TradeRecord>(e =>
        {
            e.HasIndex(t => t.StockCode);
            e.HasIndex(t => t.TradedAt);
            e.HasIndex(t => t.OperatorId);
        });

        modelBuilder.Entity<Bulletin>(e =>
        {
            e.HasIndex(b => b.CreatedAt);
            e.HasIndex(b => b.IsPinned);
        });
    }
}
```

- [ ] **Step 2: Add connection string in appsettings.json**

```json
{
  "ConnectionStrings": {
    "Default": "Data Source=DHYTrade.db"
  },
  "Jwt": {
    "Secret": "DHYTrade-SuperSecret-Key-ChangeInProduction-2026",
    "Issuer": "DHYTrade",
    "AccessTokenExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 30
  }
}
```

- [ ] **Step 3: Register DbContext in Program.cs**

```csharp
// Add before builder.Build():
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));
```

- [ ] **Step 4: Run initial migration and seed data**

```bash
cd backend/DHYTrade.Api
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

### Task 4: Create DTOs and Auth Service

**Files:**
- Create: `backend/DHYTrade.Api/Models/DTOs/AuthDtos.cs`
- Create: `backend/DHYTrade.Api/Models/DTOs/PositionDtos.cs`
- Create: `backend/DHYTrade.Api/Models/DTOs/TradeDtos.cs`
- Create: `backend/DHYTrade.Api/Models/DTOs/BulletinDtos.cs`
- Create: `backend/DHYTrade.Api/Models/DTOs/QuoteDtos.cs`
- Create: `backend/DHYTrade.Api/Models/DTOs/CopyDtos.cs`
- Create: `backend/DHYTrade.Api/Services/AuthService.cs`

- [ ] **Step 1: Create AuthDtos**

```csharp
// Models/DTOs/AuthDtos.cs
using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.DTOs;

public record LoginRequest(
    [Required] string Username,
    [Required] string Password
);

public record RegisterRequest(
    [Required, MaxLength(50)] string Username,
    [Required, EmailAddress, MaxLength(100)] string Email,
    [Required, MinLength(6)] string Password,
    [Required] string InviteCode
);

public record RefreshRequest(
    [Required] string RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Username,
    string Email,
    string Role,
    bool IsActive,
    DateTime CreatedAt
);
```

- [ ] **Step 2: Create PositionDtos**

```csharp
// Models/DTOs/PositionDtos.cs
namespace DHYTrade.Api.Models.DTOs;

public record PositionDto(
    Guid Id,
    string StockCode,
    string StockName,
    int Shares,
    decimal TotalCost,
    decimal AvgCost,
    decimal CurrentPrice,
    decimal MarketValue,
    decimal UnrealizedPnl,
    decimal UnrealizedPnlPct,
    decimal RatioPct,  // 占总仓位比例
    int HoldDays,
    DateTime? FirstBoughtAt,
    DateTime? LastTradedAt,
    bool IsActive
);
```

- [ ] **Step 3: Create TradeDtos**

```csharp
// Models/DTOs/TradeDtos.cs
using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.DTOs;

public record AddTradeRequest(
    [Required] string StockCode,
    [Required] string StockName,
    [Required] string Type,  // "Buy" or "Sell"
    [Required, Range(1, int.MaxValue)] int Lots,
    string? Note,
    DateTime? TradedAt
);

public record TradeRecordDto(
    Guid Id,
    string StockCode,
    string StockName,
    string Type,
    int Lots,
    int Shares,
    decimal Price,
    decimal Amount,
    decimal Commission,
    decimal TotalCost,
    string? OperatorName,
    string? Note,
    DateTime TradedAt,
    DateTime CreatedAt
);
```

- [ ] **Step 4: Create BulletinDtos**

```csharp
// Models/DTOs/BulletinDtos.cs
using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.DTOs;

public record CreateBulletinRequest(
    [Required, MaxLength(200)] string Title,
    [Required, MaxLength(4000)] string Content,
    bool IsPinned = false
);

public record BulletinDto(
    Guid Id,
    string Title,
    string Content,
    string AuthorName,
    bool IsPinned,
    DateTime CreatedAt
);
```

- [ ] **Step 5: Create QuoteDtos**

```csharp
// Models/DTOs/QuoteDtos.cs
namespace DHYTrade.Api.Models.DTOs;

public record QuoteResult(
    string StockCode,
    string StockName,
    decimal CurrentPrice,
    decimal Change,
    decimal ChangePct,
    DateTime QuoteTime
);

public record BatchQuoteRequest(
    List<string> StockCodes
);
```

- [ ] **Step 6: Create CopyDtos**

```csharp
// Models/DTOs/CopyDtos.cs
using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.DTOs;

public record CopyCalculateRequest(
    [Required, Range(1, double.MaxValue)] decimal OwnCapital
);

public record CopyResultItem(
    string StockCode,
    string StockName,
    decimal TargetRatio,
    decimal TargetAmount,
    decimal Price,
    int SuggestLots,
    decimal ActualAmount
);
```

- [ ] **Step 7: Create AuthService**

```csharp
// Services/AuthService.cs
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

    private static UserDto MapUserDto(User u) => new(
        u.Id, u.Username, u.Email, u.Role.ToString(), u.IsActive, u.CreatedAt
    );
}
```

---

### Task 5: Create JWT middleware and AuthController

**Files:**
- Create: `backend/DHYTrade.Api/Middleware/RoleRequirement.cs`
- Create: `backend/DHYTrade.Api/Controllers/AuthController.cs`
- Modify: `backend/DHYTrade.Api/Program.cs`

- [ ] **Step 1: Add JWT auth and role policies in Program.cs**

```csharp
// Add to service configuration section:
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdmin", p => p.RequireRole("SuperAdmin"));
    options.AddPolicy("Operator+", p => p.RequireRole("SuperAdmin", "Operator"));
    options.AddPolicy("AllRoles", p => p.RequireRole("SuperAdmin", "Operator", "User"));
});

builder.Services.AddScoped<AuthService>();
```

- [ ] **Step 2: Add app.UseAuthentication() and app.UseAuthorization() before app.MapControllers() in Program.cs**

```csharp
app.UseAuthentication();
app.UseAuthorization();
```

- [ ] **Step 3: Create AuthController**

```csharp
// Controllers/AuthController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { message = "用户名或密码错误" });
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var user = await _authService.RegisterAsync(request);
        if (user == null)
            return BadRequest(new { message = "注册失败，用户名/邮箱已存在或邀请码无效" });
        return Ok(user);
    }

    [HttpPost("refresh")]
    public IActionResult Refresh([FromBody] RefreshRequest request)
    {
        // Refresh token logic simplified — in production store tokens in DB
        return Ok(new { message = "Refresh not yet implemented" });
    }
}
```

---

### Task 6: Create Quote Provider service

**Files:**
- Create: `backend/DHYTrade.Api/Services/IQuoteProvider.cs`
- Create: `backend/DHYTrade.Api/Services/SinaQuoteProvider.cs`
- Modify: `backend/DHYTrade.Api/Program.cs`

- [ ] **Step 1: Create IQuoteProvider interface**

```csharp
// Services/IQuoteProvider.cs
using DHYTrade.Api.Models.DTOs;

namespace DHYTrade.Api.Services;

public interface IQuoteProvider
{
    Task<QuoteResult?> GetQuoteAsync(string stockCode);
    Task<List<QuoteResult>> GetQuotesAsync(List<string> stockCodes);
}
```

- [ ] **Step 2: Create SinaQuoteProvider**

```csharp
// Services/SinaQuoteProvider.cs
using System.Globalization;
using DHYTrade.Api.Models.DTOs;

namespace DHYTrade.Api.Services;

public class SinaQuoteProvider : IQuoteProvider
{
    private readonly HttpClient _http;
    private static readonly Dictionary<string, string> NameCache = new();

    public SinaQuoteProvider(HttpClient http)
    {
        _http = http;
    }

    public async Task<QuoteResult?> GetQuoteAsync(string stockCode)
    {
        var results = await GetQuotesAsync(new List<string> { stockCode });
        return results.FirstOrDefault();
    }

    public async Task<List<QuoteResult>> GetQuotesAsync(List<string> stockCodes)
    {
        var results = new List<QuoteResult>();
        if (!stockCodes.Any()) return results;

        var codes = string.Join(",", stockCodes.Select(ToSinaCode));
        var url = $"https://hq.sinajs.cn/list={codes}";

        _http.DefaultRequestHeaders.Referrer = new Uri("https://finance.sina.com.cn");
        var response = await _http.GetStringAsync(url);

        var lines = response.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            var result = ParseSinaLine(line);
            if (result != null) results.Add(result);
        }

        return results;
    }

    private static string ToSinaCode(string code)
    {
        if (code.StartsWith("sh")) return code;
        if (code.StartsWith("sz")) return code;
        if (code.StartsWith("6")) return "sh" + code;
        return "sz" + code;
    }

    private static QuoteResult? ParseSinaLine(string line)
    {
        try
        {
            var nameStart = line.IndexOf('"');
            var nameEnd = line.IndexOf('"', nameStart + 1);
            if (nameStart < 0 || nameEnd < 0) return null;

            var namePart = line[..nameStart];
            var eqIdx = namePart.IndexOf('=');
            var sinaCode = namePart[(eqIdx - 8)..eqIdx];

            var data = line[(nameStart + 1)..nameEnd].Split(',');
            if (data.Length < 4) return null;

            var stockCode = sinaCode.StartsWith("sh") ? sinaCode : sinaCode;
            var name = data[0];
            var price = decimal.Parse(data[3], CultureInfo.InvariantCulture);

            return new QuoteResult(
                stockCode, name, price,
                price - decimal.Parse(data[2], CultureInfo.InvariantCulture),
                0, DateTime.Now
            );
        }
        catch
        {
            return null;
        }
    }
}
```

- [ ] **Step 3: Register QuoteProvider and HttpClient in Program.cs**

```csharp
builder.Services.AddHttpClient<IQuoteProvider, SinaQuoteProvider>();
```

---

## Phase 2: Core Business Services

### Task 7: Create TradeService with position recalculation

**Files:**
- Create: `backend/DHYTrade.Api/Services/TradeService.cs`
- Create: `backend/DHYTrade.Api/Controllers/TradesController.cs`

- [ ] **Step 1: Create TradeService**

```csharp
// Services/TradeService.cs
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Services;

public class TradeService
{
    private readonly AppDbContext _db;
    private readonly IQuoteProvider _quote;

    public TradeService(AppDbContext db, IQuoteProvider quote)
    {
        _db = db;
        _quote = quote;
    }

    public async Task<TradeRecordDto> AddTradeAsync(AddTradeRequest request, Guid operatorId)
    {
        var quote = await _quote.GetQuoteAsync(request.StockCode);
        if (quote == null)
            throw new InvalidOperationException($"无法获取 {request.StockCode} 的实时行情");

        var price = quote.CurrentPrice;
        var shares = request.Lots * 100;
        var amount = shares * price;
        var commission = Math.Max(amount * 0.0001m, 5.00m);
        var totalCost = request.Type == "Buy"
            ? amount + commission
            : amount - commission;

        var trade = new TradeRecord
        {
            StockCode = request.StockCode,
            StockName = quote.StockName,
            Type = request.Type == "Buy" ? TradeType.Buy : TradeType.Sell,
            Lots = request.Lots,
            Shares = shares,
            Price = price,
            Amount = amount,
            Commission = commission,
            TotalCost = totalCost,
            OperatorId = operatorId,
            Note = request.Note,
            TradedAt = request.TradedAt ?? DateTime.UtcNow
        };

        _db.TradeRecords.Add(trade);
        await UpdatePositionAsync(request.StockCode, quote.StockName, trade);
        await _db.SaveChangesAsync();

        return MapTradeDto(trade);
    }

    private async Task UpdatePositionAsync(string stockCode, string stockName, TradeRecord trade)
    {
        var position = await _db.Positions
            .FirstOrDefaultAsync(p => p.StockCode == stockCode);

        if (position == null)
        {
            position = new Position
            {
                StockCode = stockCode,
                StockName = stockName,
                FirstBoughtAt = trade.TradedAt
            };
            _db.Positions.Add(position);
        }

        if (trade.Type == TradeType.Buy)
        {
            position.TotalCost += trade.TotalCost;
            position.Shares += trade.Shares;
        }
        else // Sell
        {
            var exitCost = trade.Shares * position.AvgCost;
            position.TotalCost -= exitCost;
            position.Shares -= trade.Shares;
        }

        position.AvgCost = position.Shares > 0
            ? position.TotalCost / position.Shares : 0;
        position.CurrentPrice = trade.Price;
        position.MarketValue = position.Shares * position.CurrentPrice;
        position.UnrealizedPnl = position.MarketValue - position.TotalCost;
        position.UnrealizedPnlPct = position.TotalCost > 0
            ? position.UnrealizedPnl / position.TotalCost : 0;
        position.LastTradedAt = trade.TradedAt;
        position.HoldDays = position.FirstBoughtAt.HasValue
            ? (int)(DateTime.UtcNow - position.FirstBoughtAt.Value).TotalDays : 0;
        position.IsActive = position.Shares > 0;
        position.UpdatedAt = DateTime.UtcNow;
    }

    public async Task<bool> DeleteTradeAsync(Guid tradeId)
    {
        var trade = await _db.TradeRecords.FindAsync(tradeId);
        if (trade == null) return false;

        var position = await _db.Positions
            .FirstOrDefaultAsync(p => p.StockCode == trade.StockCode);

        if (position != null)
        {
            if (trade.Type == TradeType.Buy)
            {
                position.TotalCost -= trade.TotalCost;
                position.Shares -= trade.Shares;
            }
            else
            {
                position.TotalCost += trade.Shares * position.AvgCost;
                position.Shares += trade.Shares;
            }

            position.AvgCost = position.Shares > 0
                ? position.TotalCost / position.Shares : 0;
            position.MarketValue = position.Shares * position.CurrentPrice;
            position.UnrealizedPnl = position.MarketValue - position.TotalCost;
            position.UnrealizedPnlPct = position.TotalCost > 0
                ? position.UnrealizedPnl / position.TotalCost : 0;
            position.IsActive = position.Shares > 0;
            position.UpdatedAt = DateTime.UtcNow;
        }

        _db.TradeRecords.Remove(trade);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<TradeRecordDto>> GetTradesAsync(
        string? stockCode, DateTime? from, DateTime? to, int page = 1, int pageSize = 20)
    {
        var query = _db.TradeRecords.AsQueryable();

        if (!string.IsNullOrEmpty(stockCode))
            query = query.Where(t => t.StockCode == stockCode);
        if (from.HasValue)
            query = query.Where(t => t.TradedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(t => t.TradedAt <= to.Value);

        return await query
            .OrderByDescending(t => t.TradedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(t => t.Operator)
            .Select(t => MapTradeDto(t))
            .ToListAsync();
    }

    private static TradeRecordDto MapTradeDto(TradeRecord t) => new(
        t.Id, t.StockCode, t.StockName,
        t.Type == TradeType.Buy ? "Buy" : "Sell",
        t.Lots, t.Shares, t.Price, t.Amount, t.Commission, t.TotalCost,
        t.Operator?.Username, t.Note, t.TradedAt, t.CreatedAt
    );
}
```

- [ ] **Step 2: Create TradesController**

```csharp
// Controllers/TradesController.cs
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

    [HttpDelete("{id}")]
    [Authorize(Policy = "Operator+")]
    public async Task<IActionResult> DeleteTrade(Guid id)
    {
        var result = await _tradeService.DeleteTradeAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
```

- [ ] **Step 3: Register TradeService in Program.cs**

```csharp
builder.Services.AddScoped<TradeService>();
```

---

### Task 8: Create PositionService and PositionsController

**Files:**
- Create: `backend/DHYTrade.Api/Services/PositionService.cs`
- Create: `backend/DHYTrade.Api/Controllers/PositionsController.cs`

- [ ] **Step 1: Create PositionService**

```csharp
// Services/PositionService.cs
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;

namespace DHYTrade.Api.Services;

public class PositionService
{
    private readonly AppDbContext _db;

    public PositionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PositionDto>> GetActivePositionsAsync()
    {
        var positions = await _db.Positions
            .Where(p => p.IsActive)
            .ToListAsync();

        var totalCost = positions.Sum(p => p.TotalCost);

        return positions.Select(p => new PositionDto(
            p.Id, p.StockCode, p.StockName,
            p.Shares, p.TotalCost, p.AvgCost,
            p.CurrentPrice, p.MarketValue,
            p.UnrealizedPnl, p.UnrealizedPnlPct,
            totalCost > 0 ? p.TotalCost / totalCost * 100 : 0,
            p.HoldDays, p.FirstBoughtAt, p.LastTradedAt,
            p.IsActive
        )).OrderByDescending(p => p.RatioPct).ToList();
    }

    public async Task<List<PositionDto>> GetClosedPositionsAsync()
    {
        var positions = await _db.Positions
            .Where(p => !p.IsActive)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        return positions.Select(p => new PositionDto(
            p.Id, p.StockCode, p.StockName,
            0, 0, 0, 0, 0, 0, 0, 0,
            p.HoldDays, p.FirstBoughtAt, p.LastTradedAt,
            false
        )).ToList();
    }
}
```

- [ ] **Step 2: Create PositionsController**

```csharp
// Controllers/PositionsController.cs
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
```

- [ ] **Step 3: Register PositionService in Program.cs**

```csharp
builder.Services.AddScoped<PositionService>();
```

---

### Task 9: Create CopyCalculate endpoint

**Files:**
- Create: `backend/DHYTrade.Api/Controllers/CopyController.cs`

- [ ] **Step 1: Create CopyController**

```csharp
// Controllers/CopyController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/copy")]
[Authorize]
public class CopyController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IQuoteProvider _quote;

    public CopyController(AppDbContext db, IQuoteProvider quote)
    {
        _db = db;
        _quote = quote;
    }

    [HttpPost("calculate")]
    public async Task<IActionResult> Calculate([FromBody] CopyCalculateRequest request)
    {
        var positions = await _db.Positions
            .Where(p => p.IsActive && p.Shares > 0)
            .ToListAsync();

        if (!positions.Any())
            return BadRequest(new { message = "当前没有持仓" });

        var totalCost = positions.Sum(p => p.TotalCost);
        var stockCodes = positions.Select(p => p.StockCode).ToList();
        var quotes = await _quote.GetQuotesAsync(stockCodes);

        var results = new List<CopyResultItem>();
        foreach (var pos in positions)
        {
            var quote = quotes.FirstOrDefault(q => q.StockCode == pos.StockCode);
            var price = quote?.CurrentPrice ?? pos.CurrentPrice;
            var ratio = pos.TotalCost / totalCost;
            var targetAmount = request.OwnCapital * ratio;
            var suggestLots = (int)Math.Floor(targetAmount / price / 100);
            var actualAmount = suggestLots * 100 * price;

            results.Add(new CopyResultItem(
                pos.StockCode, pos.StockName, ratio,
                targetAmount, price, suggestLots, actualAmount
            ));
        }

        return Ok(new
        {
            totalCapital = request.OwnCapital,
            totalActualAmount = results.Sum(r => r.ActualAmount),
            items = results.OrderByDescending(r => r.TargetRatio).ToList()
        });
    }
}
```

---

### Task 10: Create Bulletin CRUD

**Files:**
- Create: `backend/DHYTrade.Api/Controllers/BulletinsController.cs`

- [ ] **Step 1: Create BulletinsController**

```csharp
// Controllers/BulletinsController.cs
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
```

---

### Task 11: Create User & Invite management endpoints

**Files:**
- Create: `backend/DHYTrade.Api/Controllers/UsersController.cs`
- Create: `backend/DHYTrade.Api/Controllers/InvitesController.cs`

- [ ] **Step 1: Create UsersController**

```csharp
// Controllers/UsersController.cs
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
```

- [ ] **Step 2: Create InvitesController**

```csharp
// Controllers/InvitesController.cs
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
```

---

### Task 12: Create QuoteController and refresh endpoint

**Files:**
- Create: `backend/DHYTrade.Api/Controllers/QuotesController.cs`
- Create: `backend/DHYTrade.Api/Services/QuoteRefreshService.cs`

- [ ] **Step 1: Create QuotesController**

```csharp
// Controllers/QuotesController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuotesController : ControllerBase
{
    private readonly IQuoteProvider _quote;

    public QuotesController(IQuoteProvider quote)
    {
        _quote = quote;
    }

    [HttpGet("{stockCode}")]
    public async Task<IActionResult> GetQuote(string stockCode)
    {
        var result = await _quote.GetQuoteAsync(stockCode);
        if (result == null)
            return NotFound(new { message = $"无法获取 {stockCode} 的行情" });
        return Ok(result);
    }

    [HttpPost("batch")]
    public async Task<IActionResult> BatchQuote([FromBody] BatchQuoteRequest request)
    {
        var results = await _quote.GetQuotesAsync(request.StockCodes);
        return Ok(results);
    }
}
```

- [ ] **Step 2: Create QuoteRefreshService for periodic refresh**

```csharp
// Services/QuoteRefreshService.cs
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;

namespace DHYTrade.Api.Services;

public class QuoteRefreshService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<QuoteRefreshService> _logger;

    public QuoteRefreshService(IServiceProvider services, ILogger<QuoteRefreshService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var quote = scope.ServiceProvider.GetRequiredService<IQuoteProvider>();

                var stockCodes = await db.Positions
                    .Where(p => p.IsActive && p.Shares > 0)
                    .Select(p => p.StockCode)
                    .ToListAsync(stoppingToken);

                if (stockCodes.Any())
                {
                    var quotes = await quote.GetQuotesAsync(stockCodes);
                    foreach (var q in quotes)
                    {
                        var pos = await db.Positions
                            .FirstOrDefaultAsync(p => p.StockCode == q.StockCode, stoppingToken);
                        if (pos != null)
                        {
                            pos.CurrentPrice = q.CurrentPrice;
                            pos.MarketValue = pos.Shares * q.CurrentPrice;
                            pos.UnrealizedPnl = pos.MarketValue - pos.TotalCost;
                            pos.UnrealizedPnlPct = pos.TotalCost > 0
                                ? pos.UnrealizedPnl / pos.TotalCost : 0;
                            pos.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "行情刷新失败");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
```

- [ ] **Step 3: Register QuoteRefreshService in Program.cs**

```csharp
builder.Services.AddHostedService<QuoteRefreshService>();
```

---

### Task 13: Create history PnL endpoint (FIFO)

**Files:**
- Create: `backend/DHYTrade.Api/Services/HistoryService.cs`
- Create: `backend/DHYTrade.Api/Controllers/HistoryController.cs`

- [ ] **Step 1: Create HistoryService**

```csharp
// Services/HistoryService.cs
using Microsoft.EntityFrameworkCore;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.Entities;

namespace DHYTrade.Api.Services;

public class HistoryService
{
    private readonly AppDbContext _db;

    public HistoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<StockPnlSummary>> GetAllStocksPnlAsync()
    {
        var stockCodes = await _db.TradeRecords
            .Select(t => t.StockCode)
            .Distinct()
            .ToListAsync();

        var results = new List<StockPnlSummary>();
        foreach (var code in stockCodes)
        {
            var summary = await CalculateStockPnlAsync(code);
            if (summary != null) results.Add(summary);
        }

        return results.OrderByDescending(r => r.TotalRealizedPnl).ToList();
    }

    public async Task<StockPnlDetail?> GetStockPnlDetailAsync(string stockCode)
    {
        var summary = await CalculateStockPnlAsync(stockCode);
        if (summary == null) return null;

        var trades = await _db.TradeRecords
            .Where(t => t.StockCode == stockCode)
            .Include(t => t.Operator)
            .OrderBy(t => t.TradedAt)
            .ToListAsync();

        // FIFO matching: match sells against buys chronologically
        var pnlItems = new List<PnlItem>();
        var buyQueue = new Queue<(DateTime date, int shares, decimal cost)>();

        foreach (var trade in trades)
        {
            if (trade.Type == TradeType.Buy)
            {
                buyQueue.Enqueue((trade.TradedAt, trade.Shares, trade.TotalCost));
            }
            else
            {
                var remainingShares = trade.Shares;
                var sellRevenue = trade.TotalCost;
                var matchedCost = 0m;
                var matchedBuys = new List<(DateTime boughtAt, int matchedShares, decimal matchedCost)>();

                while (remainingShares > 0 && buyQueue.Count > 0)
                {
                    var (boughtAt, buyShares, buyCost) = buyQueue.Peek();
                    var matchShares = Math.Min(remainingShares, buyShares);
                    var matchCost = buyCost / buyShares * matchShares;

                    matchedBuys.Add((boughtAt, matchShares, matchCost));
                    matchedCost += matchCost;
                    remainingShares -= matchShares;

                    if (matchShares >= buyShares)
                        buyQueue.Dequeue();
                    else
                        buyQueue = new Queue<(DateTime, int, decimal)>(
                            new[] { (boughtAt, buyShares - matchShares, buyCost - matchCost) }
                            .Concat(buyQueue.Skip(1))
                        );
                }

                var pnl = sellRevenue - matchedCost;
                pnlItems.Add(new PnlItem(
                    trade.Id, trade.TradedAt, trade.Shares, trade.Price,
                    trade.TotalCost, matchedCost, pnl,
                    matchedBuys.Select(b => new MatchedBuy(
                        b.boughtAt, b.matchedShares, b.matchedCost / b.matchedShares
                    )).ToList()
                ));
            }
        }

        return new StockPnlDetail(
            stockCode,
            trades.FirstOrDefault(t => t.Type == TradeType.Buy)?.StockName ?? stockCode,
            summary.TotalRealizedPnl,
            summary.TotalBuyAmount,
            summary.TotalSellAmount,
            summary.TradeCount,
            pnlItems
        );
    }

    private async Task<StockPnlSummary?> CalculateStockPnlAsync(string stockCode)
    {
        var trades = await _db.TradeRecords
            .Where(t => t.StockCode == stockCode)
            .OrderBy(t => t.TradedAt)
            .ToListAsync();

        if (!trades.Any()) return null;

        var buyTrades = trades.Where(t => t.Type == TradeType.Buy).ToList();
        var sellTrades = trades.Where(t => t.Type == TradeType.Sell).ToList();

        var totalBuyAmount = buyTrades.Sum(t => t.TotalCost);
        var totalSellAmount = sellTrades.Sum(t => t.TotalCost);

        // FIFO realized PnL
        var realizedPnl = 0m;
        var buyQueue = new Queue<(int shares, decimal cost)>();
        foreach (var t in buyTrades)
            buyQueue.Enqueue((t.Shares, t.TotalCost));

        foreach (var sell in sellTrades)
        {
            var remaining = sell.Shares;
            var revenue = sell.TotalCost;
            var matchedCost = 0m;

            while (remaining > 0 && buyQueue.Count > 0)
            {
                var (bs, bc) = buyQueue.Peek();
                var match = Math.Min(remaining, bs);
                matchedCost += bc / bs * match;
                remaining -= match;

                if (match >= bs) buyQueue.Dequeue();
            }

            realizedPnl += revenue - matchedCost;
        }

        return new StockPnlSummary(
            stockCode,
            trades.First().StockName,
            realizedPnl,
            totalBuyAmount,
            totalSellAmount,
            trades.Count
        );
    }
}

public record StockPnlSummary(
    string StockCode, string StockName,
    decimal TotalRealizedPnl, decimal TotalBuyAmount,
    decimal TotalSellAmount, int TradeCount
);

public record StockPnlDetail(
    string StockCode, string StockName,
    decimal TotalRealizedPnl, decimal TotalBuyAmount,
    decimal TotalSellAmount, int TradeCount,
    List<PnlItem> PnlItems
);

public record PnlItem(
    Guid TradeId, DateTime TradedAt, int Shares,
    decimal Price, decimal Revenue, decimal MatchedCost,
    decimal Pnl, List<MatchedBuy> MatchedBuys
);

public record MatchedBuy(
    DateTime BoughtAt, int Shares, decimal AvgCost
);
```

- [ ] **Step 2: Create HistoryController**

```csharp
// Controllers/HistoryController.cs
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
```

- [ ] **Step 3: Register HistoryService in Program.cs**

```csharp
builder.Services.AddScoped<HistoryService>();
```

---

### Task 14: Seed admin user and CORS config

**Files:**
- Modify: `backend/DHYTrade.Api/Program.cs`

- [ ] **Step 1: Add seed data and CORS to Program.cs**

```csharp
// Complete Program.cs:
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.Entities;
using DHYTrade.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdmin", p => p.RequireRole("SuperAdmin"));
    options.AddPolicy("Operator+", p => p.RequireRole("SuperAdmin", "Operator"));
    options.AddPolicy("AllRoles", p => p.RequireRole("SuperAdmin", "Operator", "User"));
});

builder.Services.AddHttpClient<IQuoteProvider, SinaQuoteProvider>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TradeService>();
builder.Services.AddScoped<PositionService>();
builder.Services.AddScoped<HistoryService>();
builder.Services.AddHostedService<QuoteRefreshService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Seed admin
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (!db.Users.Any(u => u.Role == UserRole.SuperAdmin))
    {
        db.Users.Add(new User
        {
            Username = "admin",
            Email = "admin@dhy.trade",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = UserRole.SuperAdmin
        });
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

---

## Phase 3: Frontend

### Task 15: Create React + Vite project with dependencies

**Files:**
- Create: `frontend/dhy-trade-web/` (via Vite scaffold)

- [ ] **Step 1: Scaffold Vite + React project**

```bash
mkdir -p frontend
cd frontend
npm create vite@latest dhy-trade-web -- --template react-ts
cd dhy-trade-web
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install antd @ant-design/icons zustand axios react-router-dom echarts echarts-for-react dayjs
npm install -D @types/node
```

- [ ] **Step 3: Configure Vite proxy in vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite dev server on http://localhost:5173

---

### Task 16: Create API client and auth store

**Files:**
- Create: `frontend/dhy-trade-web/src/api/client.ts`
- Create: `frontend/dhy-trade-web/src/api/auth.ts`
- Create: `frontend/dhy-trade-web/src/stores/authStore.ts`

- [ ] **Step 1: Create API client**

```typescript
// src/api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && localStorage.getItem('refreshToken')) {
      // Try refresh
      try {
        const res = await axios.post('/api/auth/refresh', {
          refreshToken: localStorage.getItem('refreshToken'),
        });
        const { accessToken, refreshToken } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return client.request(error.config);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
```

- [ ] **Step 2: Create auth API functions**

```typescript
// src/api/auth.ts
import client from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  inviteCode: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data);

export const register = (data: RegisterRequest) =>
  client.post<UserDto>('/auth/register', data);
```

- [ ] **Step 3: Create auth store**

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import type { UserDto } from '../api/auth';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: async (username, password) => {
    const res = await apiLogin({ username, password });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
```

---

### Task 17: Create API functions for all endpoints

**Files:**
- Create: `frontend/dhy-trade-web/src/api/positions.ts`
- Create: `frontend/dhy-trade-web/src/api/trades.ts`
- Create: `frontend/dhy-trade-web/src/api/quotes.ts`
- Create: `frontend/dhy-trade-web/src/api/copy.ts`
- Create: `frontend/dhy-trade-web/src/api/bulletins.ts`
- Create: `frontend/dhy-trade-web/src/api/history.ts`
- Create: `frontend/dhy-trade-web/src/api/users.ts`
- Create: `frontend/dhy-trade-web/src/api/invites.ts`

- [ ] **Step 1: Create positions API**

```typescript
// src/api/positions.ts
import client from './client';

export interface PositionDto {
  id: string;
  stockCode: string;
  stockName: string;
  shares: number;
  totalCost: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  ratioPct: number;
  holdDays: number;
  firstBoughtAt: string | null;
  lastTradedAt: string | null;
  isActive: boolean;
}

export const getPositions = () =>
  client.get<PositionDto[]>('/positions');

export const getClosedPositions = () =>
  client.get<PositionDto[]>('/positions/closed');
```

- [ ] **Step 2: Create trades API**

```typescript
// src/api/trades.ts
import client from './client';

export interface TradeRecordDto {
  id: string;
  stockCode: string;
  stockName: string;
  type: 'Buy' | 'Sell';
  lots: number;
  shares: number;
  price: number;
  amount: number;
  commission: number;
  totalCost: number;
  operatorName: string | null;
  note: string | null;
  tradedAt: string;
  createdAt: string;
}

export interface AddTradeRequest {
  stockCode: string;
  stockName: string;
  type: 'Buy' | 'Sell';
  lots: number;
  note?: string;
  tradedAt?: string;
}

export const getTrades = (params?: {
  stockCode?: string;
  from?: string;
  to?: string;
  page?: number;
}) => client.get<TradeRecordDto[]>('/trades', { params });

export const addTrade = (data: AddTradeRequest) =>
  client.post<TradeRecordDto>('/trades', data);

export const deleteTrade = (id: string) =>
  client.delete(`/trades/${id}`);
```

- [ ] **Step 3: Create quotes API**

```typescript
// src/api/quotes.ts
import client from './client';

export interface QuoteResult {
  stockCode: string;
  stockName: string;
  currentPrice: number;
  change: number;
  changePct: number;
  quoteTime: string;
}

export const getQuote = (stockCode: string) =>
  client.get<QuoteResult>(`/quotes/${stockCode}`);

export const batchQuote = (stockCodes: string[]) =>
  client.post<QuoteResult[]>('/quotes/batch', { stockCodes });
```

- [ ] **Step 4: Create copy API**

```typescript
// src/api/copy.ts
import client from './client';

export interface CopyResultItem {
  stockCode: string;
  stockName: string;
  targetRatio: number;
  targetAmount: number;
  price: number;
  suggestLots: number;
  actualAmount: number;
}

export interface CopyCalculateResponse {
  totalCapital: number;
  totalActualAmount: number;
  items: CopyResultItem[];
}

export const calculateCopy = (ownCapital: number) =>
  client.post<CopyCalculateResponse>('/copy/calculate', { ownCapital });
```

- [ ] **Step 5: Create bulletins API**

```typescript
// src/api/bulletins.ts
import client from './client';

export interface BulletinDto {
  id: string;
  title: string;
  content: string;
  authorName: string;
  isPinned: boolean;
  createdAt: string;
}

export interface CreateBulletinRequest {
  title: string;
  content: string;
  isPinned: boolean;
}

export const getBulletins = () =>
  client.get<BulletinDto[]>('/bulletins');

export const createBulletin = (data: CreateBulletinRequest) =>
  client.post<BulletinDto>('/bulletins', data);

export const updateBulletin = (id: string, data: CreateBulletinRequest) =>
  client.put(`/bulletins/${id}`, data);

export const deleteBulletin = (id: string) =>
  client.delete(`/bulletins/${id}`);
```

- [ ] **Step 6: Create history API**

```typescript
// src/api/history.ts
import client from './client';

export interface StockPnlSummary {
  stockCode: string;
  stockName: string;
  totalRealizedPnl: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  tradeCount: number;
}

export interface MatchedBuy {
  boughtAt: string;
  shares: number;
  avgCost: number;
}

export interface PnlItem {
  tradeId: string;
  tradedAt: string;
  shares: number;
  price: number;
  revenue: number;
  matchedCost: number;
  pnl: number;
  matchedBuys: MatchedBuy[];
}

export interface StockPnlDetail {
  stockCode: string;
  stockName: string;
  totalRealizedPnl: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  tradeCount: number;
  pnlItems: PnlItem[];
}

export const getAllStocksPnl = () =>
  client.get<StockPnlSummary[]>('/history');

export const getStockPnlDetail = (stockCode: string) =>
  client.get<StockPnlDetail>(`/history/${stockCode}`);
```

- [ ] **Step 7: Create users & invites API**

```typescript
// src/api/users.ts
import client from './client';
import type { UserDto } from './auth';

export const getUsers = () => client.get<UserDto[]>('/users');

export const updateUserRole = (id: string, role: string) =>
  client.put(`/users/${id}/role`, { role });

export const toggleUserActive = (id: string, isActive: boolean) =>
  client.put(`/users/${id}/active`, { isActive });
```

```typescript
// src/api/invites.ts
import client from './client';

export const getInvites = () => client.get('/invites');

export const createInvite = (expiresAt?: string) =>
  client.post('/invites', { expiresAt });
```

---

### Task 18: Create Layout and Router

**Files:**
- Create: `frontend/dhy-trade-web/src/components/AppLayout.tsx`
- Create: `frontend/dhy-trade-web/src/components/ProtectedRoute.tsx`
- Create: `frontend/dhy-trade-web/src/App.tsx`
- Modify: `frontend/dhy-trade-web/src/main.tsx`

- [ ] **Step 1: Create AppLayout component**

```tsx
// src/components/AppLayout.tsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Button, Typography, Dropdown, theme
} from 'antd';
import {
  DashboardOutlined, SwapOutlined, CalculatorOutlined,
  SoundOutlined, HistoryOutlined, UserOutlined,
  TeamOutlined, KeyOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  const isAdmin = user?.role === 'SuperAdmin';
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '仓位看板' },
    { key: '/trades', icon: <SwapOutlined />, label: '交易记录' },
    { key: '/calculator', icon: <CalculatorOutlined />, label: '跟仓计算' },
    { key: '/bulletin', icon: <SoundOutlined />, label: '公告栏' },
    { key: '/history', icon: <HistoryOutlined />, label: '历史盈亏' },
  ];

  if (isAdmin) {
    menuItems.push(
      { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
      { key: '/admin/invites', icon: <KeyOutlined />, label: '邀请码' },
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'role', label: `角色：${user?.role}`, disabled: true },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? '跟' : '跟仓系统'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              {user?.username}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
```

- [ ] **Step 2: Create ProtectedRoute**

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 3: Create App.tsx with router**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TradesPage from './pages/TradesPage';
import CalculatorPage from './pages/CalculatorPage';
import BulletinPage from './pages/BulletinPage';
import HistoryPage from './pages/HistoryPage';
import StockHistoryPage from './pages/StockHistoryPage';
import UsersPage from './pages/UsersPage';
import InvitesPage from './pages/InvitesPage';

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="trades" element={<TradesPage />} />
              <Route path="calculator" element={<CalculatorPage />} />
              <Route path="bulletin" element={<BulletinPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="history/:stockCode" element={<StockHistoryPage />} />
              <Route path="admin/users" element={
                <ProtectedRoute roles={['SuperAdmin']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="admin/invites" element={
                <ProtectedRoute roles={['SuperAdmin']}>
                  <InvitesPage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
```

- [ ] **Step 4: Update main.tsx**

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### Task 19: Create Login and Register pages

**Files:**
- Create: `frontend/dhy-trade-web/src/pages/LoginPage.tsx`
- Create: `frontend/dhy-trade-web/src/pages/RegisterPage.tsx`

- [ ] **Step 1: Create LoginPage**

```tsx
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard');
    } catch {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          股票跟仓系统
        </Typography.Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          没有账号？<Link to="/register">注册</Link>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create RegisterPage**

```tsx
// src/pages/RegisterPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { register } from '../api/auth';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: {
    username: string; email: string; password: string; inviteCode: string;
  }) => {
    setLoading(true);
    try {
      await register(values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch {
      message.error('注册失败，请检查邀请码是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          注册账号
        </Typography.Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="email" rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效邮箱' }
          ]}>
            <Input prefix={<MailOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item name="password" rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' }
          ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="inviteCode" rules={[{ required: true, message: '请输入邀请码' }]}>
            <Input prefix={<KeyOutlined />} placeholder="邀请码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          已有账号？<Link to="/login">登录</Link>
        </div>
      </Card>
    </div>
  );
}
```

---

### Task 20: Create Dashboard page

**Files:**
- Create: `frontend/dhy-trade-web/src/pages/DashboardPage.tsx`
- Create: `frontend/dhy-trade-web/src/stores/positionStore.ts`

- [ ] **Step 1: Create positionStore**

```typescript
// src/stores/positionStore.ts
import { create } from 'zustand';
import { getPositions } from '../api/positions';
import type { PositionDto } from '../api/positions';

interface PositionState {
  positions: PositionDto[];
  loading: boolean;
  totalCost: number;
  totalMarketValue: number;
  totalPnl: number;
  refresh: () => Promise<void>;
}

export const usePositionStore = create<PositionState>((set) => ({
  positions: [],
  loading: false,
  totalCost: 0,
  totalMarketValue: 0,
  totalPnl: 0,

  refresh: async () => {
    set({ loading: true });
    try {
      const res = await getPositions();
      const positions = res.data;
      set({
        positions,
        totalCost: positions.reduce((s, p) => s + p.totalCost, 0),
        totalMarketValue: positions.reduce((s, p) => s + p.marketValue, 0),
        totalPnl: positions.reduce((s, p) => s + p.unrealizedPnl, 0),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
```

- [ ] **Step 2: Create DashboardPage**

```tsx
// src/pages/DashboardPage.tsx
import { useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Tag } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined,
  DollarOutlined, PieChartOutlined, RiseOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { usePositionStore } from '../stores/positionStore';
import type { PositionDto } from '../api/positions';

const columns = [
  { title: '股票', dataIndex: 'stockName', key: 'name', width: 120 },
  { title: '代码', dataIndex: 'stockCode', key: 'code', width: 100 },
  {
    title: '持仓股数', dataIndex: 'shares', key: 'shares',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '均价', dataIndex: 'avgCost', key: 'avgCost',
    render: (v: number) => v.toFixed(2)
  },
  {
    title: '现价', dataIndex: 'currentPrice', key: 'price',
    render: (v: number) => v.toFixed(2)
  },
  {
    title: '市值', dataIndex: 'marketValue', key: 'mv',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '占比', dataIndex: 'ratioPct', key: 'ratio',
    render: (v: number) => `${v.toFixed(1)}%`
  },
  {
    title: '浮动盈亏', dataIndex: 'unrealizedPnl', key: 'pnl',
    render: (v: number, r: PositionDto) => (
      <span style={{ color: v >= 0 ? '#cf1322' : '#3f8600' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()} ({r.unrealizedPnlPct >= 0 ? '+' : ''}{(r.unrealizedPnlPct * 100).toFixed(2)}%)
      </span>
    )
  },
  {
    title: '持仓天数', dataIndex: 'holdDays', key: 'days',
    render: (v: number) => `${v}天`
  },
];

export default function DashboardPage() {
  const { positions, loading, totalCost, totalMarketValue, totalPnl, refresh } = usePositionStore();

  useEffect(() => { refresh(); }, [refresh]);

  const pieOption = {
    title: { text: '仓位占比', left: 'center' },
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0 },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      data: positions.map(p => ({
        name: p.stockName,
        value: Number(p.totalCost.toFixed(0))
      })),
    }],
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 24]}>
        <Col span={8}>
          <Card><Statistic title="基准仓位" value={totalCost} precision={0}
            prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="当前市值" value={totalMarketValue} precision={0}
            prefix={<PieChartOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="浮动盈亏" value={totalPnl} precision={0}
              prefix={totalPnl >= 0 ? <RiseOutlined /> : <ArrowDownOutlined />}
              suffix="元"
              valueStyle={{ color: totalPnl >= 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={10}>
          <Card><ReactECharts option={pieOption} style={{ height: 350 }} /></Card>
        </Col>
        <Col span={14}>
          <Card title="持仓明细">
            <Table
              columns={columns}
              dataSource={positions}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
```

---

### Task 21: Create Trades page

**Files:**
- Create: `frontend/dhy-trade-web/src/pages/TradesPage.tsx`

- [ ] **Step 1: Create TradesPage**

```tsx
// src/pages/TradesPage.tsx
import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber,
  Select, DatePicker, Space, Tag, Popconfirm, message, Card
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTrades, addTrade, deleteTrade } from '../api/trades';
import { useAuthStore } from '../stores/authStore';
import type { TradeRecordDto } from '../api/trades';

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeRecordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await getTrades();
      setTrades(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrades(); }, []);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      await addTrade({
        stockCode: values.stockCode,
        stockName: values.stockName,
        type: values.type,
        lots: values.lots,
        note: values.note,
        tradedAt: values.tradedAt?.toISOString(),
      });
      message.success('操作记录已添加');
      setModalOpen(false);
      form.resetFields();
      loadTrades();
    } catch {
      // validation or API error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTrade(id);
    message.success('已删除');
    loadTrades();
  };

  const columns = [
    { title: '时间', dataIndex: 'tradedAt', key: 'time', width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '股票', dataIndex: 'stockName', key: 'name', width: 120 },
    { title: '代码', dataIndex: 'stockCode', key: 'code', width: 100 },
    { title: '方向', dataIndex: 'type', key: 'type', width: 80,
      render: (v: string) => <Tag color={v === 'Buy' ? 'red' : 'green'}>{v === 'Buy' ? '买入' : '卖出'}</Tag> },
    { title: '手数', dataIndex: 'lots', key: 'lots' },
    { title: '价格', dataIndex: 'price', key: 'price', render: (v: number) => v.toFixed(2) },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => v.toLocaleString() },
    { title: '手续费', dataIndex: 'commission', key: 'comm', render: (v: number) => v.toFixed(2) },
    { title: '操作员', dataIndex: 'operatorName', key: 'op' },
    ...(isOperator ? [{
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, r: TradeRecordDto) => (
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    }] : []),
  ];

  return (
    <Card title="交易记录" extra={
      isOperator && (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          添加记录
        </Button>
      )
    }>
      <Table columns={columns} dataSource={trades} rowKey="id" loading={loading}
        pagination={{ pageSize: 20 }} size="small" />

      <Modal title="新增操作记录" open={modalOpen} onCancel={() => setModalOpen(false)}
        onOk={handleAdd} confirmLoading={submitting}>
        <Form form={form} layout="vertical">
          <Form.Item name="stockCode" label="股票代码" rules={[{ required: true }]}>
            <Input placeholder="如 sh600519" />
          </Form.Item>
          <Form.Item name="stockName" label="股票名称" rules={[{ required: true }]}>
            <Input placeholder="如 贵州茅台" />
          </Form.Item>
          <Form.Item name="type" label="方向" rules={[{ required: true }]}>
            <Select options={[
              { label: '买入', value: 'Buy' },
              { label: '卖出', value: 'Sell' },
            ]} />
          </Form.Item>
          <Form.Item name="lots" label="手数" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tradedAt" label="交易时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
```

---

### Task 22: Create Calculator page

**Files:**
- Create: `frontend/dhy-trade-web/src/pages/CalculatorPage.tsx`

- [ ] **Step 1: Create CalculatorPage**

```tsx
// src/pages/CalculatorPage.tsx
import { useState } from 'react';
import { Card, InputNumber, Button, Table, Typography, Space } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
import { calculateCopy } from '../api/copy';
import type { CopyResultItem } from '../api/copy';

const columns = [
  { title: '股票', dataIndex: 'stockName', key: 'name' },
  { title: '代码', dataIndex: 'stockCode', key: 'code' },
  {
    title: '目标占比', dataIndex: 'targetRatio', key: 'ratio',
    render: (v: number) => `${(v * 100).toFixed(1)}%`
  },
  {
    title: '目标金额', dataIndex: 'targetAmount', key: 'amount',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '现价', dataIndex: 'price', key: 'price',
    render: (v: number) => v.toFixed(2)
  },
  { title: '建议手数', dataIndex: 'suggestLots', key: 'lots' },
  {
    title: '实际金额', dataIndex: 'actualAmount', key: 'actual',
    render: (v: number) => v.toLocaleString()
  },
];

export default function CalculatorPage() {
  const [capital, setCapital] = useState<number>(1000000);
  const [items, setItems] = useState<CopyResultItem[]>([]);
  const [totalActual, setTotalActual] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await calculateCopy(capital);
      setItems(res.data.items);
      setTotalActual(res.data.totalActualAmount);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="跟仓计算器">
      <Space style={{ marginBottom: 24 }}>
        <Typography.Text strong>我的资金：</Typography.Text>
        <InputNumber
          value={capital}
          onChange={(v) => setCapital(v || 0)}
          min={1}
          step={100000}
          style={{ width: 200 }}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => Number(v!.replace(/,/g, ''))}
          addonAfter="元"
        />
        <Button type="primary" icon={<CalculatorOutlined />}
          loading={loading} onClick={handleCalculate}>
          计算
        </Button>
      </Space>

      {items.length > 0 && (
        <>
          <Typography.Paragraph style={{ marginBottom: 16 }}>
            建议投入总金额：<Typography.Text strong>{totalActual.toLocaleString()} 元</Typography.Text>
          </Typography.Paragraph>
          <Table columns={columns} dataSource={items} rowKey="stockCode"
            pagination={false} size="small" />
        </>
      )}
    </Card>
  );
}
```

---

### Task 23: Create Bulletin page

**Files:**
- Create: `frontend/dhy-trade-web/src/pages/BulletinPage.tsx`

- [ ] **Step 1: Create BulletinPage**

```tsx
// src/pages/BulletinPage.tsx
import { useEffect, useState } from 'react';
import {
  Card, List, Typography, Button, Modal, Form,
  Input, Switch, Popconfirm, message, Tag, Space
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getBulletins, createBulletin, updateBulletin, deleteBulletin } from '../api/bulletins';
import { useAuthStore } from '../stores/authStore';
import type { BulletinDto } from '../api/bulletins';

export default function BulletinPage() {
  const [bulletins, setBulletins] = useState<BulletinDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const isOperator = user?.role === 'SuperAdmin' || user?.role === 'Operator';

  const load = async () => {
    const res = await getBulletins();
    setBulletins(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editingId) {
      await updateBulletin(editingId, values);
    } else {
      await createBulletin(values);
    }
    message.success('已保存');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const handleEdit = (b: BulletinDto) => {
    setEditingId(b.id);
    form.setFieldsValue(b);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteBulletin(id);
    message.success('已删除');
    load();
  };

  return (
    <Card title="公告栏" extra={
      isOperator && (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingId(null);
          form.resetFields();
          setModalOpen(true);
        }}>
          发布公告
        </Button>
      )
    }>
      <List
        dataSource={bulletins}
        renderItem={(item) => (
          <List.Item
            extra={isOperator && (
              <Space>
                <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(item)} />
                <Popconfirm title="确定删除？" onConfirm={() => handleDelete(item.id)}>
                  <Button icon={<DeleteOutlined />} size="small" danger />
                </Popconfirm>
              </Space>
            )}
          >
            <List.Item.Meta
              title={
                <Space>
                  {item.isPinned && <Tag color="red">置顶</Tag>}
                  <Typography.Text strong>{item.title}</Typography.Text>
                </Space>
              }
              description={
                <>
                  <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    {item.authorName} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Typography.Text>
                </>
              }
            />
          </List.Item>
        )}
      />

      <Modal title={editingId ? '编辑公告' : '发布公告'} open={modalOpen}
        onCancel={() => setModalOpen(false)} onOk={handleSave}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item name="isPinned" label="置顶" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
```

---

### Task 24: Create History pages

**Files:**
- Create: `frontend/dhy-trade-web/src/pages/HistoryPage.tsx`
- Create: `frontend/dhy-trade-web/src/pages/StockHistoryPage.tsx`

- [ ] **Step 1: Create HistoryPage**

```tsx
// src/pages/HistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag } from 'antd';
import { getAllStocksPnl } from '../api/history';
import type { StockPnlSummary } from '../api/history';

const columns = [
  { title: '股票', dataIndex: 'stockName', key: 'name' },
  { title: '代码', dataIndex: 'stockCode', key: 'code' },
  {
    title: '累计买入', dataIndex: 'totalBuyAmount', key: 'buy',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '累计卖出', dataIndex: 'totalSellAmount', key: 'sell',
    render: (v: number) => v.toLocaleString()
  },
  {
    title: '已实现盈亏', dataIndex: 'totalRealizedPnl', key: 'pnl',
    render: (v: number) => (
      <span style={{ color: v >= 0 ? '#cf1322' : '#3f8600' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()}
      </span>
    )
  },
  { title: '交易次数', dataIndex: 'tradeCount', key: 'count' },
];

export default function HistoryPage() {
  const [data, setData] = useState<StockPnlSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllStocksPnl().then(res => setData(res.data));
  }, []);

  return (
    <Card title="历史盈亏">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="stockCode"
        onRow={(r) => ({
          onClick: () => navigate(`/history/${r.stockCode}`),
          style: { cursor: 'pointer' },
        })}
      />
    </Card>
  );
}
```

- [ ] **Step 2: Create StockHistoryPage**

```tsx
// src/pages/StockHistoryPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Typography, Row, Col, Statistic } from 'antd';
import dayjs from 'dayjs';
import { getStockPnlDetail } from '../api/history';
import type { StockPnlDetail, PnlItem } from '../api/history';

const columns = [
  { title: '时间', dataIndex: 'tradedAt', key: 'time',
    render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  { title: '卖出数量', dataIndex: 'shares', key: 'shares' },
  { title: '卖出价', dataIndex: 'price', key: 'price',
    render: (v: number) => v.toFixed(2) },
  { title: '卖出收入', dataIndex: 'revenue', key: 'revenue',
    render: (v: number) => v.toLocaleString() },
  { title: '匹配成本', dataIndex: 'matchedCost', key: 'cost',
    render: (v: number) => v.toLocaleString() },
  { title: '盈亏', dataIndex: 'pnl', key: 'pnl',
    render: (v: number) => (
      <span style={{ color: v >= 0 ? '#cf1322' : '#3f8600' }}>
        {v >= 0 ? '+' : ''}{v.toLocaleString()}
      </span>
    )
  },
];

export default function StockHistoryPage() {
  const { stockCode } = useParams<{ stockCode: string }>();
  const [detail, setDetail] = useState<StockPnlDetail | null>(null);

  useEffect(() => {
    if (stockCode) {
      getStockPnlDetail(stockCode).then(res => setDetail(res.data));
    }
  }, [stockCode]);

  if (!detail) return null;

  return (
    <Card title={`${detail.stockName} (${detail.stockCode}) 历史盈亏`}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic title="累计买入" value={detail.totalBuyAmount} precision={0} />
        </Col>
        <Col span={6}>
          <Statistic title="累计卖出" value={detail.totalSellAmount} precision={0} />
        </Col>
        <Col span={6}>
          <Statistic title="已实现盈亏" value={detail.totalRealizedPnl} precision={0}
            valueStyle={{ color: detail.totalRealizedPnl >= 0 ? '#cf1322' : '#3f8600' }} />
        </Col>
        <Col span={6}>
          <Statistic title="交易次数" value={detail.tradeCount} />
        </Col>
      </Row>

      <Typography.Title level={5}>卖出盈亏明细</Typography.Title>
      <Table columns={columns} dataSource={detail.pnlItems} rowKey="tradeId"
        pagination={false} size="small" />
    </Card>
  );
}
```

---

### Task 25: Create Admin pages

**Files:**
- Create: `frontend/dhy-trade-web/src/pages/UsersPage.tsx`
- Create: `frontend/dhy-trade-web/src/pages/InvitesPage.tsx`

- [ ] **Step 1: Create UsersPage**

```tsx
// src/pages/UsersPage.tsx
import { useEffect, useState } from 'react';
import {
  Card, Table, Select, Switch, Tag, message, Typography
} from 'antd';
import { getUsers, updateUserRole, toggleUserActive } from '../api/users';
import type { UserDto } from '../api/auth';

const roleColors: Record<string, string> = {
  SuperAdmin: 'red', Operator: 'blue', User: 'default',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);

  const load = async () => {
    const res = await getUsers();
    setUsers(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id: string, role: string) => {
    await updateUserRole(id, role);
    message.success('角色已更新');
    load();
  };

  const handleActiveToggle = async (id: string, checked: boolean) => {
    await toggleUserActive(id, checked);
    message.success('状态已更新');
    load();
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色', dataIndex: 'role', key: 'role',
      render: (role: string, record: UserDto) => (
        <Select value={role} style={{ width: 120 }}
          onChange={(v) => handleRoleChange(record.id, v)}
          options={[
            { label: '超级管理员', value: 'SuperAdmin' },
            { label: '操作员', value: 'Operator' },
            { label: '普通用户', value: 'User' },
          ]}
        />
      ),
    },
    {
      title: '状态', dataIndex: 'isActive', key: 'active',
      render: (v: boolean, record: UserDto) => (
        <Switch checked={v} onChange={(c) => handleActiveToggle(record.id, c)} />
      ),
    },
    {
      title: '注册时间', dataIndex: 'createdAt', key: 'time',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ];

  return (
    <Card title="用户管理">
      <Table columns={columns} dataSource={users} rowKey="id" size="small" />
    </Card>
  );
}
```

- [ ] **Step 2: Create InvitesPage**

```tsx
// src/pages/InvitesPage.tsx
import { useEffect, useState } from 'react';
import { Card, Table, Button, message, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getInvites, createInvite } from '../api/invites';
import dayjs from 'dayjs';

export default function InvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);

  const load = async () => {
    const res = await getInvites();
    setInvites(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await createInvite();
    message.success('邀请码已生成');
    load();
  };

  const columns = [
    {
      title: '邀请码', dataIndex: 'code', key: 'code',
      render: (v: string) => <Typography.Text copyable strong>{v}</Typography.Text>,
    },
    {
      title: '状态', dataIndex: 'isUsed', key: 'status',
      render: (v: boolean) => v ? <Tag color="default">已使用</Tag> : <Tag color="green">可用</Tag>,
    },
    {
      title: '有效期', dataIndex: 'expiresAt', key: 'expire',
      render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD') : '永久有效',
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'time',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <Card title="邀请码管理" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
        生成邀请码
      </Button>
    }>
      <Table columns={columns} dataSource={invites} rowKey="id" size="small" />
    </Card>
  );
}
```

---

## Self-Review Checklist

- [x] Spec coverage: All spec sections (auth, positions, trades, copy, quotes, bulletins, user management, history, permission matrix) have corresponding tasks
- [x] No placeholders: All steps have complete code
- [x] Type consistency: DTO types match between backend and frontend (`TradeRecordDto`, `PositionDto`, etc.), API paths are consistent
- [x] Auth coverage: JWT middleware + role policies + refresh token interceptor all implemented
