using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Models.Entities;
using Server.Models.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Server.DataBase;
using Server.Models;

namespace Server.Controllers
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "SystemAdmin")]
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly AppDBContext _context;

        public AdminController(UserManager<User> userManager, RoleManager<Role> roleManager, AppDBContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        private async Task AddAuditAsync(string userId, string eventType, string? details = null)
        {
            _context.UserAudits.Add(new UserAudit
            {
                UserId = userId,
                EventType = eventType,
                Details = details,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        // GET: api/admin/users/{id}/pending-approvals
        [HttpGet("users/{id}/pending-approvals")]
        public async Task<IActionResult> GetPendingApprovals(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var pending = await _context.Timesheets
                .Include(t => t.Employee)
                .Where(t => (t.Status == TimesheetStatus.Submitted || t.Status == TimesheetStatus.Resubmitted)
                            && t.ApproverId == id)
                .OrderByDescending(t => t.Date)
                .Select(t => new {
                    t.Id,
                    t.Date,
                    t.EmployeeId,
                    EmployeeName = t.Employee.FirstName + " " + t.Employee.LastName,
                    t.ProjectName,
                    t.HoursWorked,
                    t.Status
                })
                .ToListAsync();

            return Ok(new { count = pending.Count, items = pending });
        }

        public class ReassignApprovalsRequest
        {
            public string FromUserId { get; set; } = string.Empty;
            public string ToUserId { get; set; } = string.Empty;
            public int[]? TimesheetIds { get; set; }
        }

        // POST: api/admin/reassign-approvals
        [HttpPost("reassign-approvals")]
        public async Task<IActionResult> ReassignApprovals([FromBody] ReassignApprovalsRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FromUserId) || string.IsNullOrWhiteSpace(request.ToUserId))
                return BadRequest("FromUserId and ToUserId are required.");

            if (request.FromUserId == request.ToUserId)
                return BadRequest("From and To users must be different.");

            var fromUser = await _userManager.FindByIdAsync(request.FromUserId);
            var toUser = await _userManager.FindByIdAsync(request.ToUserId);
            if (fromUser == null || toUser == null) return NotFound("From or To user not found.");

            // Validate destination user has appropriate role
            var toIsManager = await _userManager.IsInRoleAsync(toUser, "Manager");
            var toIsHrAdmin = await _userManager.IsInRoleAsync(toUser, "HRAdmin");
            if (!toIsManager && !toIsHrAdmin)
                return BadRequest("Destination user must be Manager or HRAdmin.");

            var query = _context.Timesheets
                .Where(t => (t.Status == TimesheetStatus.Submitted || t.Status == TimesheetStatus.Resubmitted)
                            && t.ApproverId == request.FromUserId);

            if (request.TimesheetIds != null && request.TimesheetIds.Length > 0)
            {
                var ids = request.TimesheetIds.Distinct().ToArray();
                query = query.Where(t => ids.Contains(t.Id));
            }

            var items = await query.ToListAsync();
            if (items.Count == 0) return Ok(new { updated = 0 });

            foreach (var t in items)
            {
                t.ApproverId = request.ToUserId;
                t.ModifiedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await AddAuditAsync(request.FromUserId, "ReassignedPendingApprovals", $"{items.Count} items moved to {request.ToUserId}");
            await AddAuditAsync(request.ToUserId, "AssignedPendingApprovals", $"{items.Count} items received from {request.FromUserId}");

            return Ok(new { updated = items.Count });
        }

        // POST: api/admin/users/{id}/lock
        [HttpPost("users/{id}/lock")]
        public async Task<IActionResult> LockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            user.LockoutEnabled = true;
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
            user.IsActive = false;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            await AddAuditAsync(user.Id, "Lock", "User locked by admin");
            return NoContent();
        }

        // POST: api/admin/users/{id}/unlock
        [HttpPost("users/{id}/unlock")]
        public async Task<IActionResult> UnlockUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            user.LockoutEnd = null;
            user.IsActive = true;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            await AddAuditAsync(user.Id, "Unlock", "User unlocked by admin");
            return NoContent();
        }


        public class SetPasswordRequest
        {
            public string NewPassword { get; set; } = string.Empty;
            public bool RequireChangeOnNextLogin { get; set; } = true;
        }

        // POST: api/admin/users/{id}/password/set
        // Allows admin to set a specific password (no temp generation). Optionally enforce change on next login.
        [HttpPost("users/{id}/password/set")]
        public async Task<IActionResult> SetPassword(string id, [FromBody] SetPasswordRequest request)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest("NewPassword is required");

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            await _userManager.UpdateSecurityStampAsync(user);

            user.MustChangePassword = request.RequireChangeOnNextLogin;
            await _userManager.UpdateAsync(user);

            await AddAuditAsync(user.Id, "PasswordSetByAdmin", request.RequireChangeOnNextLogin ? "Set password and required change" : "Set password");

            return NoContent();
        }

        // POST: api/admin/users/{id}/password/force-change
        // Placeholder implementation: return 204 so the client UI does not error. Hook into a real flag later.
        [HttpPost("users/{id}/password/force-change")]
        public async Task<IActionResult> ForcePasswordChange(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            if (!user.MustChangePassword)
            {
                user.MustChangePassword = true;
                await _userManager.UpdateAsync(user);
            }
            await AddAuditAsync(user.Id, "ForcePasswordChange", "Admin flagged user to change password");
            return NoContent();
        }

        // GET: api/admin/users/{id}/audit
        // Returns audit entries in the structure expected by the client: timestamp, actor, action, details
        [HttpGet("users/{id}/audit")]
        public async Task<IActionResult> GetUserAudit(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            // Load raw audits first
            var audits = await _context.UserAudits
                .Where(a => a.UserId == id)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            // Regex for GUID-like IDs
            var guidRegex = new Regex(@"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

            // Collect distinct userIds found in details
            var referencedIds = audits
                .SelectMany(a => guidRegex.Matches(a.Details ?? string.Empty).Select(m => m.Value))
                .Distinct()
                .ToList();

            var referencedUsers = await _context.Users
                .Where(u => referencedIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
                .ToListAsync();
            var nameById = referencedUsers.ToDictionary(
                u => u.Id,
                u => string.IsNullOrWhiteSpace((u.FirstName ?? "").Trim() + (u.LastName ?? "").Trim())
                        ? (u.Email ?? u.Id)
                        : ($"{u.FirstName} {u.LastName}").Trim());

            var results = audits.Select(a =>
            {
                string details = a.Details ?? string.Empty;
                string actor = "System";

                // Replace IDs with names and set actor to the first resolved name if present
                var matches = guidRegex.Matches(details).Cast<Match>().ToList();
                foreach (var m in matches)
                {
                    if (nameById.TryGetValue(m.Value, out var name))
                    {
                        details = details.Replace(m.Value, name);
                        if (actor == "System") actor = name;
                    }
                }

                return new
                {
                    timestamp = a.CreatedAt,
                    actor,
                    action = a.EventType,
                    details
                };
            }).ToList();

            return Ok(results);
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    IsActive = user.IsActive,
                    Roles = roles.ToList()
                });
            }

            return Ok(userDtos);
        }

        // GET: api/admin/users/paged
        [HttpGet("users/paged")]
        public async Task<IActionResult> GetUsersPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 200) pageSize = 20;

            var query = _userManager.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(u =>
                    (u.Email != null && u.Email.ToLower().Contains(term)) ||
                    (u.FirstName != null && u.FirstName.ToLower().Contains(term)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(term))
                );
            }

            var total = await query.CountAsync();
            var users = await query
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = new List<UserDto>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                items.Add(new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    IsActive = u.IsActive,
                    Roles = roles.ToList()
                });
            }

            return Ok(new { total, items });
        }

        // GET: api/admin/users/{id}
        [HttpGet("users/{id}")]
        public async Task<ActionResult<UserDto>> GetUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsActive = user.IsActive,
                Roles = roles.ToList()
            });
        }

        // POST: api/admin/users
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto model)
        {
            var user = new User
            {
                UserName = model.Email,
                Email = model.Email,
                NormalizedEmail = model.Email.ToUpperInvariant(),
                NormalizedUserName = model.Email.ToUpperInvariant(),
                FirstName = model.FirstName,
                LastName = model.LastName,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            if (model.Roles != null && model.Roles.Any())
            {
                var validRoles = model.Roles.Where(role => _roleManager.Roles.Any(r => r.Name == role)).ToList();
                if (validRoles.Any())
                    await _userManager.AddToRolesAsync(user, validRoles);
            }

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, null);
        }
        //update
        // PUT: api/admin/users/{id}
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto model)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.IsActive = model.IsActive;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            if (model.Roles != null && model.Roles.Any())
            {
                var validRoles = model.Roles.Where(role => _roleManager.Roles.Any(r => r.Name == role)).ToList();
                if (validRoles.Any())
                    await _userManager.AddToRolesAsync(user, validRoles);
            }

            return NoContent();
        }

        // DELETE: api/admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (user.Id == _userManager.GetUserId(User))
                return BadRequest("You cannot delete your own account.");

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            return NoContent();
        }

        // GET: api/admin/roles
        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            var roles = await _roleManager.Roles
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description
                })
                .ToListAsync();

            return Ok(roles);
        }
    }
}
