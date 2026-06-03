namespace DHYTrade.Api.Models.DTOs;

public record QuoteResult(
    string StockCode,
    string StockName,
    decimal CurrentPrice,
    decimal Change,
    decimal ChangePct,
    DateTime QuoteTime
);

public record QuoteSearchResult(
    string StockCode,
    string StockName,
    string MarketType
);

public record BatchQuoteRequest(
    List<string> StockCodes
);
