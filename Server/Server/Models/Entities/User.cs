using Microsoft.AspNetCore.Identity;

namespace Server.Models.Entities
{
    public class User : IdentityUser
    {
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public bool IsActive { get; set; } = true;
        public bool MustChangePassword { get; set; } = false;
        public DateTime DateCreated { get; set; } = DateTime.UtcNow;
        public ICollection<UserAudit> UserAudits { get; set; } = new List<UserAudit>();
    }
}
