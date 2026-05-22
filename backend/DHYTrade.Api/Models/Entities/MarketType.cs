namespace DHYTrade.Api.Models.Entities;

public enum MarketType
{
    AShare = 0,
    HongKong = 1,
}

public static class MarketTypeExtensions
{
    public static string GetBaseCapitalKey(this MarketType marketType) => $"BaseCapital:{marketType}";

    public static string NormalizeStockCode(this string? stockCode)
    {
        if (string.IsNullOrWhiteSpace(stockCode))
            return string.Empty;

        var normalized = stockCode.Trim().ToLowerInvariant();

        if (normalized.StartsWith("sh") || normalized.StartsWith("sz") || normalized.StartsWith("hk"))
            return normalized[2..];

        return normalized;
    }
}