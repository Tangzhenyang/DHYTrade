# Auth Persistence and Copy Lots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Docker-deployed users logged in through refresh token rotation and improve copy calculation so low-ratio positions can suggest one affordable lot with editable lots in the UI.

**Architecture:** Add refresh-token persistence to `User`, implement rotation in `AuthService`, and complete `/api/auth/refresh`. Extract copy lot math into a small backend helper so it is testable without controller/database setup, then wire it into `CopyController`. Keep the frontend API shape unchanged and make the lots cell locally editable with derived actual totals.

**Tech Stack:** ASP.NET Core Web API, EF Core SQLite migrations, xUnit, React, TypeScript, Vite, Ant Design.

---

## File Structure

- Modify `backend/DHYTrade.Api/Models/Entities/User.cs`: add nullable refresh token fields.
- Modify `backend/DHYTrade.Api/Services/AuthService.cs`: store refresh tokens on login and rotate them on refresh.
- Modify `backend/DHYTrade.Api/Controllers/AuthController.cs`: return token payloads from refresh and unauthorized responses on invalid tokens.
- Create `backend/DHYTrade.Api/Services/CopyLotCalculator.cs`: pure helper for board-lot suggestion and actual amount math.
- Modify `backend/DHYTrade.Api/Controllers/CopyController.cs`: use `CopyLotCalculator`.
- Create EF migration files under `backend/DHYTrade.Api/Migrations/`: add nullable refresh token columns.
- Create `backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj`: backend test project.
- Create `backend/DHYTrade.Api.Tests/AuthServiceTests.cs`: refresh token behavior tests.
- Create `backend/DHYTrade.Api.Tests/CopyLotCalculatorTests.cs`: one-lot fallback tests.
- Modify `frontend/dhy-trade-web/src/api/client.ts`: prevent repeated refresh attempts for the same failed request.
- Modify `frontend/dhy-trade-web/src/pages/CalculatorPage.tsx`: make lots editable and recalculate row and total amounts.

---

### Task 1: Add Backend Test Project

**Files:**
- Create: `backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj`

- [ ] **Step 1: Create the test project file**

Add this file:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="18.0.1" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.5">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.0.8" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\DHYTrade.Api\DHYTrade.Api.csproj" />
  </ItemGroup>
</Project>
```

- [ ] **Step 2: Run tests to verify the project is discoverable**

Run:

```powershell
dotnet test backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj
```

Expected: test run succeeds with no tests discovered or zero tests run. If package restore requires network, rerun with approved escalation.

- [ ] **Step 3: Commit**

```powershell
git add backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj
git commit -m "test: add backend test project"
```

---

### Task 2: Implement Refresh Token Rotation with TDD

**Files:**
- Create: `backend/DHYTrade.Api.Tests/AuthServiceTests.cs`
- Modify: `backend/DHYTrade.Api/Models/Entities/User.cs`
- Modify: `backend/DHYTrade.Api/Services/AuthService.cs`
- Modify: `backend/DHYTrade.Api/Controllers/AuthController.cs`

- [ ] **Step 1: Write failing auth service tests**

Create `backend/DHYTrade.Api.Tests/AuthServiceTests.cs`:

```csharp
using DHYTrade.Api.Data;
using DHYTrade.Api.Models.DTOs;
using DHYTrade.Api.Models.Entities;
using DHYTrade.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
dotnet test backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj --filter AuthServiceTests
```

Expected: FAIL because `User.RefreshToken`, `User.RefreshTokenExpiresAt`, and `AuthService.RefreshAsync` do not exist.

- [ ] **Step 3: Add refresh token fields to User**

Modify `backend/DHYTrade.Api/Models/Entities/User.cs` by adding:

```csharp
[MaxLength(256)]
public string? RefreshToken { get; set; }

public DateTime? RefreshTokenExpiresAt { get; set; }
```

Place them after `CreatedAt` so token metadata stays near account metadata.

- [ ] **Step 4: Implement minimal refresh token storage and rotation**

Modify `backend/DHYTrade.Api/Services/AuthService.cs`:

```csharp
public async Task<AuthResponse?> LoginAsync(LoginRequest request)
{
    var user = await _db.Users.FirstOrDefaultAsync(u =>
        u.Username == request.Username && u.IsActive);

    if (user == null) return null;

    if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        return null;

    var accessToken = GenerateAccessToken(user);
    var refreshToken = GenerateRefreshToken();
    user.RefreshToken = refreshToken;
    user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpiryDays());
    await _db.SaveChangesAsync();

    return new AuthResponse(accessToken, refreshToken, MapUserDto(user));
}

public async Task<AuthResponse?> RefreshAsync(RefreshRequest request)
{
    var user = await _db.Users.FirstOrDefaultAsync(u =>
        u.IsActive &&
        u.RefreshToken == request.RefreshToken &&
        u.RefreshTokenExpiresAt != null &&
        u.RefreshTokenExpiresAt > DateTime.UtcNow);

    if (user == null) return null;

    var accessToken = GenerateAccessToken(user);
    var refreshToken = GenerateRefreshToken();
    user.RefreshToken = refreshToken;
    user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenExpiryDays());
    await _db.SaveChangesAsync();

    return new AuthResponse(accessToken, refreshToken, MapUserDto(user));
}

private double GetRefreshTokenExpiryDays() =>
    double.Parse(_config["Jwt:RefreshTokenExpiryDays"]!);
```

- [ ] **Step 5: Wire controller refresh endpoint**

Modify `backend/DHYTrade.Api/Controllers/AuthController.cs`:

```csharp
[HttpPost("refresh")]
public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
{
    var result = await _authService.RefreshAsync(request);
    if (result == null)
        return Unauthorized(new { message = "登录已过期，请重新登录" });

    return Ok(result);
}
```

- [ ] **Step 6: Run auth tests to verify green**

Run:

```powershell
dotnet test backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj --filter AuthServiceTests
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add backend/DHYTrade.Api.Tests/AuthServiceTests.cs backend/DHYTrade.Api/Models/Entities/User.cs backend/DHYTrade.Api/Services/AuthService.cs backend/DHYTrade.Api/Controllers/AuthController.cs
git commit -m "feat: rotate refresh tokens"
```

---

### Task 3: Add Refresh Token Migration

**Files:**
- Create: `backend/DHYTrade.Api/Migrations/<timestamp>_AddUserRefreshTokens.cs`
- Create: `backend/DHYTrade.Api/Migrations/<timestamp>_AddUserRefreshTokens.Designer.cs`
- Modify: `backend/DHYTrade.Api/Migrations/AppDbContextModelSnapshot.cs`

- [ ] **Step 1: Generate migration**

Run:

```powershell
dotnet ef migrations add AddUserRefreshTokens --project backend/DHYTrade.Api
```

Expected: migration adds nullable `RefreshToken` and `RefreshTokenExpiresAt` columns to `Users`.

- [ ] **Step 2: Inspect generated migration**

Verify the `Up` method contains:

```csharp
migrationBuilder.AddColumn<string>(
    name: "RefreshToken",
    table: "Users",
    type: "TEXT",
    maxLength: 256,
    nullable: true);

migrationBuilder.AddColumn<DateTime>(
    name: "RefreshTokenExpiresAt",
    table: "Users",
    type: "TEXT",
    nullable: true);
```

Verify the `Down` method drops both columns.

- [ ] **Step 3: Build backend**

Run:

```powershell
dotnet build backend/DHYTrade.Api/DHYTrade.Api.csproj
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```powershell
git add backend/DHYTrade.Api/Migrations
git commit -m "feat: add refresh token migration"
```

---

### Task 4: Add Copy Lot Calculator with TDD

**Files:**
- Create: `backend/DHYTrade.Api/Services/CopyLotCalculator.cs`
- Create: `backend/DHYTrade.Api.Tests/CopyLotCalculatorTests.cs`
- Modify: `backend/DHYTrade.Api/Controllers/CopyController.cs`

- [ ] **Step 1: Write failing copy lot tests**

Create `backend/DHYTrade.Api.Tests/CopyLotCalculatorTests.cs`:

```csharp
using DHYTrade.Api.Services;

namespace DHYTrade.Api.Tests;

public class CopyLotCalculatorTests
{
    [Fact]
    public void CalculateSuggestLots_WhenRatioResultIsZeroAndCapitalCanBuyOneLot_ReturnsOneLot()
    {
        var result = CopyLotCalculator.Calculate(ownCapital: 10000m, targetAmount: 50m, price: 20m);

        Assert.Equal(1, result.SuggestLots);
        Assert.Equal(2000m, result.ActualAmount);
    }

    [Fact]
    public void CalculateSuggestLots_WhenCapitalCannotBuyOneLot_ReturnsZeroLots()
    {
        var result = CopyLotCalculator.Calculate(ownCapital: 1000m, targetAmount: 50m, price: 20m);

        Assert.Equal(0, result.SuggestLots);
        Assert.Equal(0m, result.ActualAmount);
    }

    [Fact]
    public void CalculateSuggestLots_WhenRatioResultIsAtLeastOne_UsesFlooredLots()
    {
        var result = CopyLotCalculator.Calculate(ownCapital: 100000m, targetAmount: 9500m, price: 20m);

        Assert.Equal(4, result.SuggestLots);
        Assert.Equal(8000m, result.ActualAmount);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```powershell
dotnet test backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj --filter CopyLotCalculatorTests
```

Expected: FAIL because `CopyLotCalculator` does not exist.

- [ ] **Step 3: Create calculator helper**

Create `backend/DHYTrade.Api/Services/CopyLotCalculator.cs`:

```csharp
namespace DHYTrade.Api.Services;

public static class CopyLotCalculator
{
    private const int SharesPerLot = 100;

    public static CopyLotCalculation Calculate(decimal ownCapital, decimal targetAmount, decimal price)
    {
        if (price <= 0)
            return new CopyLotCalculation(0, 0);

        var suggestLots = (int)Math.Floor(targetAmount / price / SharesPerLot);
        if (suggestLots == 0 && ownCapital >= price * SharesPerLot)
            suggestLots = 1;

        var actualAmount = suggestLots * SharesPerLot * price;
        return new CopyLotCalculation(suggestLots, actualAmount);
    }
}

public record CopyLotCalculation(int SuggestLots, decimal ActualAmount);
```

- [ ] **Step 4: Run copy calculator tests to verify green**

Run:

```powershell
dotnet test backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj --filter CopyLotCalculatorTests
```

Expected: PASS.

- [ ] **Step 5: Wire helper into controller**

Modify the loop in `backend/DHYTrade.Api/Controllers/CopyController.cs`:

```csharp
var ratio = pos.TotalCost / baseCapital;
var targetAmount = request.OwnCapital * ratio;
var lotCalculation = CopyLotCalculator.Calculate(request.OwnCapital, targetAmount, price);

results.Add(new CopyResultItem(
    pos.StockCode, pos.StockName, ratio,
    targetAmount, price, lotCalculation.SuggestLots, lotCalculation.ActualAmount
));
```

- [ ] **Step 6: Run backend tests**

Run:

```powershell
dotnet test backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add backend/DHYTrade.Api/Services/CopyLotCalculator.cs backend/DHYTrade.Api.Tests/CopyLotCalculatorTests.cs backend/DHYTrade.Api/Controllers/CopyController.cs
git commit -m "feat: suggest affordable one-lot copy trades"
```

---

### Task 5: Harden Frontend Refresh Retry

**Files:**
- Modify: `frontend/dhy-trade-web/src/api/client.ts`

- [ ] **Step 1: Add a typed retry flag**

At the top of `frontend/dhy-trade-web/src/api/client.ts`, change imports and add the retry request type:

```ts
import axios, { type InternalAxiosRequestConfig } from 'axios';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
```

- [ ] **Step 2: Guard refresh retry**

Replace the response interceptor error branch with:

```ts
async (error) => {
  const originalConfig = error.config as RetryableRequestConfig | undefined;
  const isAuthEndpoint = originalConfig?.url?.includes('/auth/');

  if (
    error.response?.status === 401 &&
    localStorage.getItem('refreshToken') &&
    originalConfig &&
    !originalConfig._retry &&
    !isAuthEndpoint
  ) {
    originalConfig._retry = true;
    try {
      const res = await axios.post('/api/auth/refresh', {
        refreshToken: localStorage.getItem('refreshToken'),
      });
      if (res.data?.accessToken) {
        const { accessToken, refreshToken } = res.data;
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        originalConfig.headers.Authorization = `Bearer ${accessToken}`;
        return client.request(originalConfig);
      }
      throw new Error('Invalid refresh response');
    } catch {
      localStorage.clear();
      window.location.href = '/login';
    }
  }

  if (error.response?.status === 401 && !isAuthEndpoint) {
    localStorage.clear();
    window.location.href = '/login';
  }

  return Promise.reject(error);
}
```

- [ ] **Step 3: Run frontend build**

Run:

```powershell
npm run build
```

Working directory: `frontend/dhy-trade-web`.

Expected: TypeScript and Vite build succeed.

- [ ] **Step 4: Commit**

```powershell
git add frontend/dhy-trade-web/src/api/client.ts
git commit -m "fix: avoid repeated auth refresh retries"
```

---

### Task 6: Make Copy Lots Editable in the Frontend

**Files:**
- Modify: `frontend/dhy-trade-web/src/pages/CalculatorPage.tsx`

- [ ] **Step 1: Add a row update helper**

Inside `CalculatorPage`, before `columns`, add:

```ts
const updateItemLots = (stockCode: string, lots: number | null) => {
  const nextLots = Math.max(0, Math.floor(lots || 0));
  setItems((prev) => {
    const next = prev.map((item) =>
      item.stockCode === stockCode
        ? {
            ...item,
            suggestLots: nextLots,
            actualAmount: nextLots * 100 * item.price,
          }
        : item
    );
    setTotalActual(next.reduce((sum, item) => sum + item.actualAmount, 0));
    return next;
  });
};
```

- [ ] **Step 2: Replace the lots column renderer**

In the `columns` definition, replace the `建议手数` column with:

```tsx
{
  title: '手数',
  dataIndex: 'suggestLots',
  key: 'lots',
  render: (v: number, record: CopyResultItem) => (
    <InputNumber
      value={v}
      min={0}
      step={1}
      precision={0}
      onChange={(value) => updateItemLots(record.stockCode, value)}
      style={{ width: 96 }}
    />
  )
}
```

- [ ] **Step 3: Keep API calculation total derived from returned items**

In `handleCalculate`, replace:

```ts
setItems(res.data.items);
setTotalActual(res.data.totalActualAmount);
```

with:

```ts
setItems(res.data.items);
setTotalActual(res.data.items.reduce((sum, item) => sum + item.actualAmount, 0));
```

- [ ] **Step 4: Run frontend build and lint**

Run:

```powershell
npm run build
npm run lint
```

Working directory: `frontend/dhy-trade-web`.

Expected: both commands succeed.

- [ ] **Step 5: Commit**

```powershell
git add frontend/dhy-trade-web/src/pages/CalculatorPage.tsx
git commit -m "feat: allow editing copy calculator lots"
```

---

### Task 7: Final Verification

**Files:**
- No new code files.

- [ ] **Step 1: Run backend build**

Run:

```powershell
dotnet build backend/DHYTrade.Api/DHYTrade.Api.csproj
```

Expected: build succeeds.

- [ ] **Step 2: Run backend tests**

Run:

```powershell
dotnet test backend/DHYTrade.Api.Tests/DHYTrade.Api.Tests.csproj
```

Expected: all tests pass.

- [ ] **Step 3: Run frontend build**

Run:

```powershell
npm run build
```

Working directory: `frontend/dhy-trade-web`.

Expected: build succeeds.

- [ ] **Step 4: Run frontend lint**

Run:

```powershell
npm run lint
```

Working directory: `frontend/dhy-trade-web`.

Expected: lint succeeds.

- [ ] **Step 5: Inspect final diff**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only intentional implementation files are changed, plus any existing unrelated untracked files left untouched.
