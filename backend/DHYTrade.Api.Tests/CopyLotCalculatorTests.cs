using DHYTrade.Api.Services;
using Xunit;

namespace DHYTrade.Api.Tests;

public class CopyLotCalculatorTests
{
    [Fact]
    public void CalculateSuggestLots_WhenRatioResultIsZeroAndCapitalCanBuyOneLot_ReturnsOneLot()
    {
        var result = CopyLotCalculator.Calculate(ownCapital: 10000m, targetAmount: 50m, price: 20m);

        Assert.Equal(1, result.SuggestLots);
        Assert.Equal(2000m, result.ActualAmount);
    }

    [Fact]
    public void CalculateSuggestLots_WhenCapitalCannotBuyOneLot_ReturnsZeroLots()
    {
        var result = CopyLotCalculator.Calculate(ownCapital: 1000m, targetAmount: 50m, price: 20m);

        Assert.Equal(0, result.SuggestLots);
        Assert.Equal(0m, result.ActualAmount);
    }

    [Fact]
    public void CalculateSuggestLots_WhenRatioResultIsAtLeastOne_UsesFlooredLots()
    {
        var result = CopyLotCalculator.Calculate(ownCapital: 100000m, targetAmount: 9500m, price: 20m);

        Assert.Equal(4, result.SuggestLots);
        Assert.Equal(8000m, result.ActualAmount);
    }
}
