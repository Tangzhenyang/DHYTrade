using System.Text.Json;

namespace DHYTrade.Api.Services;

public class ExchangeRateService : IExchangeRateService
{
    private readonly HttpClient _http;

    public ExchangeRateService(HttpClient http)
    {
        _http = http;
    }

    public async Task<ExchangeRateResult> GetHkdToCnyRateAsync()
    {
        using var response = await _http.GetAsync("https://open.er-api.com/v6/latest/HKD");
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        var root = document.RootElement;

        if (!root.TryGetProperty("rates", out var ratesElement)
            || !ratesElement.TryGetProperty("CNY", out var cnyRateElement)
            || !cnyRateElement.TryGetDecimal(out var cnyRate)
            || cnyRate <= 0)
            throw new InvalidOperationException("无法获取港币兑人民币汇率");

        return new ExchangeRateResult(
            "HKD",
            "CNY",
            cnyRate,
            DateTime.UtcNow
        );
    }
}