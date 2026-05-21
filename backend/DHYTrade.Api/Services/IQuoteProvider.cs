using DHYTrade.Api.Models.DTOs;

namespace DHYTrade.Api.Services;

public interface IQuoteProvider
{
    Task<QuoteResult?> GetQuoteAsync(string stockCode);
    Task<List<QuoteResult>> GetQuotesAsync(List<string> stockCodes);
}
