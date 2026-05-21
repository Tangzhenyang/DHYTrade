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
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();

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
