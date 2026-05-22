using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.Entities;

public class SystemConfig
{
    [Key, MaxLength(50)]
    public string Key { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Value { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
