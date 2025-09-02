using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Models.Entities;
namespace Server.DataBase 
{
    public class AppDBContext : IdentityDbContext<User, Role, string>
    {
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Timesheet> Timesheets { get; set; }
        public DbSet<UserAudit> UserAudits { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public AppDBContext(DbContextOptions<AppDBContext> options) : base(options)
        {
            
        }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // config PostgreSQL specific settings
            builder.HasPostgresExtension("uuid-ossp");

            // Seed initial roles
            builder.Entity<Role>().HasData(
                new Role { Id = "1", Name = "SystemAdmin", NormalizedName = "SYSTEMADMIN", Description = "System Administrator" },
                new Role { Id = "2", Name = "Employee", NormalizedName = "EMPLOYEE", Description = "Employee" },
                new Role { Id = "3", Name = "Manager", NormalizedName = "MANAGER", Description = "Manager" },
                new Role { Id = "4", Name = "HRAdmin", NormalizedName = "HRADMIN", Description = "HR Administrator" }
            );
            builder.Entity<RefreshToken>()
                .HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);   // delete refresh tokens when user is deleted

            builder.Entity<UserAudit>()
                .HasOne(ua => ua.User)
                .WithMany(u => u.UserAudits)
                .HasForeignKey(ua => ua.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<LeaveRequest>()
                .HasOne(l => l.Employee)
                .WithMany()
                .HasForeignKey(l => l.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<LeaveRequest>()
                .HasOne(l => l.Approver)
                .WithMany()
                .HasForeignKey(l => l.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Holiday>()
                .HasIndex(h => h.Date);
        }
    }
}
