using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Server.DataBase;
using Server.Models.Entities;
using System.Security.Claims;

namespace Server.Controllers
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [Route("api/leaves")]
    [ApiController]
    public class LeaveController : ControllerBase
    {
        private readonly AppDBContext _context;
        private readonly UserManager<User> _userManager;

        public LeaveController(AppDBContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public class CreateLeaveRequest
        {
            public LeaveType Type { get; set; } = LeaveType.Annual;
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string? Reason { get; set; }
        }

        public class ApproveLeaveRequest
        {
            public bool IsApproved { get; set; }
            public string? RejectionReason { get; set; }
        }

        private string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

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

        // POST: api/leaves
        [HttpPost]
        [Authorize(Roles = "Employee,SystemAdmin,Manager,HRAdmin")]
        public async Task<IActionResult> Create([FromBody] CreateLeaveRequest request)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            if (request.StartDate.Date > request.EndDate.Date)
                return BadRequest("StartDate must be <= EndDate");

            // Overlap check with existing approved or pending
            var overlaps = await _context.LeaveRequests
                .AnyAsync(l => l.EmployeeId == userId &&
                               l.Status != LeaveStatus.Rejected &&
                               l.StartDate.Date <= request.EndDate.Date &&
                               request.StartDate.Date <= l.EndDate.Date);
            if (overlaps)
                return BadRequest("Overlapping leave request exists");

            var leave = new LeaveRequest
            {
                EmployeeId = userId,
                Type = request.Type,
                StartDate = request.StartDate.Date,
                EndDate = request.EndDate.Date,
                Reason = request.Reason,
                Status = LeaveStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.LeaveRequests.Add(leave);
            await _context.SaveChangesAsync();

            await AddAuditAsync(userId, "LeaveCreated", $"Leave {leave.Id} {leave.Type} {leave.StartDate:yyyy-MM-dd} to {leave.EndDate:yyyy-MM-dd}");
            return CreatedAtAction(nameof(GetMy), new { id = leave.Id }, null);
        }

        // GET: api/leaves/my
        [HttpGet("my")]
        [Authorize(Roles = "Employee,SystemAdmin,Manager,HRAdmin")]
        public async Task<IActionResult> GetMy()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var items = await _context.LeaveRequests
                .Where(l => l.EmployeeId == userId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
            return Ok(items);
        }

        // GET: api/leaves/pending
        [HttpGet("pending")]
        [Authorize(Roles = "Manager,HRAdmin,SystemAdmin")]
        public async Task<IActionResult> GetPending()
        {
            var items = await _context.LeaveRequests
                .Where(l => l.Status == LeaveStatus.Pending)
                .OrderBy(l => l.StartDate)
                .ToListAsync();
            return Ok(items);
        }

        // PUT: api/leaves/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Employee,SystemAdmin,Manager,HRAdmin")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateLeaveRequest request)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var leave = await _context.LeaveRequests.FindAsync(id);
            if (leave == null) return NotFound();
            if (leave.EmployeeId != userId) return Forbid();
            if (leave.Status != LeaveStatus.Pending)
                return BadRequest("Only pending leaves can be updated");
            if (request.StartDate.Date > request.EndDate.Date)
                return BadRequest("StartDate must be <= EndDate");

            // overlap except itself
            var overlaps = await _context.LeaveRequests
                .AnyAsync(l => l.EmployeeId == userId && l.Id != id &&
                               l.Status != LeaveStatus.Rejected &&
                               l.StartDate.Date <= request.EndDate.Date &&
                               request.StartDate.Date <= l.EndDate.Date);
            if (overlaps)
                return BadRequest("Overlapping leave request exists");

            leave.Type = request.Type;
            leave.StartDate = request.StartDate.Date;
            leave.EndDate = request.EndDate.Date;
            leave.Reason = request.Reason;
            leave.ModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await AddAuditAsync(userId, "LeaveUpdated", $"Leave {leave.Id} updated");
            return NoContent();
        }

        // PUT: api/leaves/{id}/approve
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Manager,HRAdmin,SystemAdmin")]
        public async Task<IActionResult> Approve(int id, [FromBody] ApproveLeaveRequest request)
        {
            var approverId = CurrentUserId;
            if (string.IsNullOrEmpty(approverId)) return Unauthorized();

            var leave = await _context.LeaveRequests.FindAsync(id);
            if (leave == null) return NotFound();
            if (leave.Status != LeaveStatus.Pending)
                return BadRequest("Only pending leaves can be approved or rejected");

            leave.Status = request.IsApproved ? LeaveStatus.Approved : LeaveStatus.Rejected;
            leave.ApproverId = approverId;
            leave.ModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var approver = await _userManager.FindByIdAsync(approverId);
            var approverName = approver != null ? $"{approver.FirstName} {approver.LastName}".Trim() : approverId;
            await AddAuditAsync(leave.EmployeeId, request.IsApproved ? "LeaveApproved" : "LeaveRejected",
                request.IsApproved ? $"Leave {leave.Id} approved by {approverName}" : $"Leave {leave.Id} rejected by {approverName}: {request.RejectionReason}");
            return NoContent();
        }

        // DELETE: api/leaves/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Employee,SystemAdmin,Manager,HRAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var leave = await _context.LeaveRequests.FindAsync(id);
            if (leave == null) return NotFound();
            if (leave.EmployeeId != userId) return Forbid();
            if (leave.Status != LeaveStatus.Pending)
                return BadRequest("Only pending leaves can be deleted");

            _context.LeaveRequests.Remove(leave);
            await _context.SaveChangesAsync();

            await AddAuditAsync(userId, "LeaveDeleted", $"Leave {leave.Id} deleted");
            return NoContent();
        }
    }
}
