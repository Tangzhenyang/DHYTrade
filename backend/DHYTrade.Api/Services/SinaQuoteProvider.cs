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
        if (code.StartsWith("sh", StringComparison.OrdinalIgnoreCase)) return code.ToLowerInvariant();
        if (code.StartsWith("sz", StringComparison.OrdinalIgnoreCase)) return code.ToLowerInvariant();
        if (code.StartsWith("hk", StringComparison.OrdinalIgnoreCase)) return code.ToLowerInvariant();
        if (code.Length == 5 && code.All(char.IsDigit)) return "hk" + code;
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

            const string prefix = "var hq_str_";
            var codeStart = line.IndexOf(prefix, StringComparison.Ordinal);
            var eqIdx = line.IndexOf('=');
            if (codeStart < 0 || eqIdx < 0) return null;

            var sinaCode = line[(codeStart + prefix.Length)..eqIdx];

            var data = line[(nameStart + 1)..nameEnd].Split(',');
            if (data.Length < 4) return null;

            if (sinaCode.StartsWith("hk", StringComparison.OrdinalIgnoreCase))
            {
                if (data.Length < 7) return null;

                var hkName = data[1];
                var hkYestClose = decimal.Parse(data[3], CultureInfo.InvariantCulture);
                var hkPrice = decimal.Parse(data[6], CultureInfo.InvariantCulture);

                if (hkPrice == 0) hkPrice = hkYestClose;

                return new QuoteResult(
                    sinaCode.ToLowerInvariant(), hkName, hkPrice,
                    hkPrice - hkYestClose,
                    0, DateTime.Now
                );
            }

            var name = data[0];
            var price = decimal.Parse(data[3], CultureInfo.InvariantCulture);
            var yestClose = decimal.Parse(data[2], CultureInfo.InvariantCulture);

            // 停牌或盘前时，现价可能为0，此时取昨收盘价
            if (price == 0) price = yestClose;

            return new QuoteResult(
                sinaCode.ToLowerInvariant(), name, price,
                price - yestClose,
                0, DateTime.Now
            );
        }
        catch
        {
            return null;
        }
    }
}
