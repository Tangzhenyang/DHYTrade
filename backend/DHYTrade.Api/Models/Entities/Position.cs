// Models/Entities/Position.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DHYTrade.Api.Models.Entities;

public class Position
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public MarketType MarketType { get; set; } = MarketType.AShare;

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
