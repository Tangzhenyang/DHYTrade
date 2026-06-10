namespace DHYTrade.Api.Services;

public static class CopyLotCalculator
{
    private const int SharesPerLot = 100;

    public static CopyLotCalculation Calculate(decimal ownCapital, decimal targetAmount, decimal price)
    {
        if (price <= 0)
            return new CopyLotCalculation(0, 0);

        var suggestLots = (int)Math.Floor(targetAmount / price / SharesPerLot);
        if (suggestLots == 0 && ownCapital >= price * SharesPerLot)
            suggestLots = 1;

        var actualAmount = suggestLots * SharesPerLot * price;
        return new CopyLotCalculation(suggestLots, actualAmount);
    }
}

public record CopyLotCalculation(int SuggestLots, decimal ActualAmount);
