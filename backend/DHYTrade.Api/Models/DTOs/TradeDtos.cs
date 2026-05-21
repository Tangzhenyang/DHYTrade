using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.DTOs;

public record AddTradeRequest(
    [Required] string StockCode,
    [Required] string StockName,
    [Required] string Type,
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
