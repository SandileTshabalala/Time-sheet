using System.ComponentModel.DataAnnotations;

namespace Server.Models.Entities
{
    public class Holiday
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public DateTime Date { get; set; }
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        public bool IsPublic { get; set; } = true;
        public string? CountryCode { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
