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
    decimal RatioPct,
    int HoldDays,
    DateTime? FirstBoughtAt,
    DateTime? LastTradedAt,
    bool IsActive
);
