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
