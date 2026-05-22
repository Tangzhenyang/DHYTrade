using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DHYTrade.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketTypeAndSegmentedCapital : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TradeRecords_StockCode",
                table: "TradeRecords");

            migrationBuilder.DropIndex(
                name: "IX_Positions_StockCode",
                table: "Positions");

            migrationBuilder.AddColumn<int>(
                name: "MarketType",
                table: "TradeRecords",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MarketType",
                table: "Positions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TradeRecords_MarketType_StockCode",
                table: "TradeRecords",
                columns: new[] { "MarketType", "StockCode" });

            migrationBuilder.CreateIndex(
                name: "IX_Positions_MarketType_StockCode",
                table: "Positions",
                columns: new[] { "MarketType", "StockCode" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TradeRecords_MarketType_StockCode",
                table: "TradeRecords");

            migrationBuilder.DropIndex(
                name: "IX_Positions_MarketType_StockCode",
                table: "Positions");

            migrationBuilder.DropColumn(
                name: "MarketType",
                table: "TradeRecords");

            migrationBuilder.DropColumn(
                name: "MarketType",
                table: "Positions");

            migrationBuilder.CreateIndex(
                name: "IX_TradeRecords_StockCode",
                table: "TradeRecords",
                column: "StockCode");

            migrationBuilder.CreateIndex(
                name: "IX_Positions_StockCode",
                table: "Positions",
                column: "StockCode",
                unique: true);
        }
    }
}
