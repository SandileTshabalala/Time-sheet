using Microsoft.AspNetCore.Identity;
using Server.Models.Entities;

namespace Server.DataBase
{
    public static class DbSeeder
    {
        public static async Task SeedRolesAsync(RoleManager<Role> roleManager)
        {
            var roles = new List<Role>
            {
                new() { Name = "SystemAdmin", Description = "System Administrator" },
                new() { Name = "Employee", Description = "Employee" },
                new() { Name = "Manager", Description = "Manager" },
                new() { Name = "HRAdmin", Description = "HR Administrator" }
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role.Name!))
                {
                    await roleManager.CreateAsync(role);
                }
            }
        }

        public static async Task SeedSystemAdminAsync(UserManager<User> userManager, RoleManager<Role> roleManager)
        {
            var email = "admin@admin.com";
            var password = "Admin@123";

            var existingUser = await userManager.FindByEmailAsync(email);
            if (existingUser != null)
                return;

            var adminUser = new User
            {
                UserName = email,
                Email = email,
                FirstName = "System",
                LastName = "Admin",
                EmailConfirmed = true,
                IsActive = true
            };

            var result = await userManager.CreateAsync(adminUser, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "SystemAdmin");
            }
            else
            {
                foreach (var error in result.Errors)
                {
                    Console.WriteLine($"Admin seeding error: {error.Description}");
                }
            }
        }
    }
}
