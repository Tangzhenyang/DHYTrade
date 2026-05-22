using System.ComponentModel.DataAnnotations;

namespace DHYTrade.Api.Models.DTOs;

public record CreateBulletinRequest(
    [Required, MaxLength(200)] string Title,
    [Required, MaxLength(4000)] string Content,
    bool IsPinned = false
);

public record BulletinDto(
    Guid Id,
    string Title,
    string Content,
    string AuthorName,
    bool IsPinned,
    DateTime CreatedAt
);
