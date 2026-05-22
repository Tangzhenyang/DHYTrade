using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.DTOs;

public record AddTradeRequest(
    [Required] string MarketType,
    [Required] string StockCode,
    string StockName,
    [Required] string Type,
    [Required, Range(1, int.MaxValue)] int Lots,
    decimal? Price,
    string? Note,
    DateTime? TradedAt
);

public record UpdateTradeRequest(
    [Required] string MarketType,
    [Required] string StockCode,
    string StockName,
    [Required] string Type,
    [Required, Range(1, int.MaxValue)] int Lots,
    decimal? Price,
    string? Note,
    DateTime? TradedAt
);

public record TradeRecordDto(
    Guid Id,
    string MarketType,
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
