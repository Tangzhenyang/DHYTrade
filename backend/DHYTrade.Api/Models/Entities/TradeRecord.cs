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

    [Required]
    public MarketType MarketType { get; set; } = MarketType.AShare;

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
