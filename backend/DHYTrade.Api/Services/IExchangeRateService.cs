namespace DHYTrade.Api.Services;

public interface IExchangeRateService
{
    Task<ExchangeRateResult> GetHkdToCnyRateAsync();
}

public record ExchangeRateResult(
    string BaseCurrency,
    string QuoteCurrency,
    decimal Rate,
    DateTime QuoteTime
);