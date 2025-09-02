using Microsoft.AspNetCore.Identity;

namespace Server.Models.Entities
{
    public class Role : IdentityRole
    {
        public string Description { get; set; } = string.Empty;
    }
}