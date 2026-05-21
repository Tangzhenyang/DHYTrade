using System.Globalization;
using System.Text;
using DHYTrade.Api.Models.DTOs;

namespace DHYTrade.Api.Services;

public class SinaQuoteProvider : IQuoteProvider
{
    private readonly HttpClient _http;

    public SinaQuoteProvider(HttpClient http)
    {
        _http = http;
    }

    public async Task<QuoteResult?> GetQuoteAsync(string stockCode)
    {
        var results = await GetQuotesAsync(new List<string> { stockCode });
        return results.FirstOrDefault();
    }

    public async Task<List<QuoteResult>> GetQuotesAsync(List<string> stockCodes)
    {
        var results = new List<QuoteResult>();
        if (!stockCodes.Any()) return results;

        var codes = string.Join(",", stockCodes.Select(ToSinaCode));
        var url = $"https://hq.sinajs.cn/list={codes}";

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Referrer = new Uri("https://finance.sina.com.cn");

        var response = await _http.SendAsync(request);
        var bytes = await response.Content.ReadAsByteArrayAsync();

        // Sina API returns GB18030/GBK encoded content
        var encoding = Encoding.GetEncoding("GB18030");
        var text = encoding.GetString(bytes);

        var lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            var result = ParseSinaLine(line);
            if (result != null) results.Add(result);
        }

        return results;
    }

    private static string ToSinaCode(string code)
    {
        if (code.StartsWith("sh")) return code;
        if (code.StartsWith("sz")) return code;
        if (code.StartsWith("6")) return "sh" + code;
        return "sz" + code;
    }

    private static QuoteResult? ParseSinaLine(string line)
    {
        try
        {
            var nameStart = line.IndexOf('"');
            var nameEnd = line.IndexOf('"', nameStart + 1);
            if (nameStart < 0 || nameEnd < 0) return null;

            var namePart = line[..nameStart];
            var eqIdx = namePart.IndexOf('=');
            var sinaCode = namePart[(eqIdx - 8)..eqIdx];

            var data = line[(nameStart + 1)..nameEnd].Split(',');
            if (data.Length < 4) return null;

            var name = data[0];
            var price = decimal.Parse(data[3], CultureInfo.InvariantCulture);

            return new QuoteResult(
                sinaCode, name, price,
                price - decimal.Parse(data[2], CultureInfo.InvariantCulture),
                0, DateTime.Now
            );
        }
        catch
        {
            return null;
        }
    }
}
