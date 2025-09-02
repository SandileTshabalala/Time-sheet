using Microsoft.EntityFrameworkCore;
using Server.DataBase;
using Server.Models;
using Server.Models.DTOs;
using Server.Models.Entities;
using Microsoft.AspNetCore.SignalR;
using Server.Hubs;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Identity;

namespace Server.Services
{
    public class TimesheetService : ITimesheetService
    {
        private readonly AppDBContext _context;
        private readonly ILogger<TimesheetService> _logger;
        private readonly IHubContext<NotificationsHub> _hub;
        private readonly IMemoryCache _cache;
        private readonly UserManager<User> _userManager;

        public TimesheetService(AppDBContext context, ILogger<TimesheetService> logger, IHubContext<NotificationsHub> hub, IMemoryCache cache, UserManager<User> userManager)
        {
            _context = context;
            _logger = logger;
            _hub = hub;
            _cache = cache;
            _userManager = userManager;
        }

        private async Task<string> GetUserDisplayNameAsync(string userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return userId;
            var first = user.FirstName?.Trim();
            var last = user.LastName?.Trim();
            var name = string.Join(" ", new[] { first, last }.Where(s => !string.IsNullOrWhiteSpace(s)));
            return string.IsNullOrWhiteSpace(name) ? user.Email ?? userId : name;
        }

        public async Task<TimesheetDto> CreateTimesheetAsync(string employeeId, CreateTimesheetDto createDto)
        {
            var timesheet = new Timesheet
            {
                EmployeeId = employeeId,
                Date = createDto.Date,
                HoursWorked = createDto.HoursWorked,
                OvertimeHours = createDto.OvertimeHours,
                BreakHours = createDto.BreakHours,
                ProjectName = createDto.ProjectName,
                TaskDescription = createDto.TaskDescription,
                Comments = createDto.Comments,
                Period = createDto.Period,
                WeekStartDate = createDto.WeekStartDate,
                WeekEndDate = createDto.WeekEndDate,
                Status = TimesheetStatus.Draft,
                CreatedDate = DateTime.UtcNow
            };

            _context.Timesheets.Add(timesheet);
            await _context.SaveChangesAsync();

            // Audit: Timesheet created
            var creatorName = await GetUserDisplayNameAsync(employeeId);
            _context.UserAudits.Add(new UserAudit
            {
                UserId = employeeId,
                EventType = "TimesheetCreated",
                Details = $"Timesheet {timesheet.Id} created for {timesheet.Date:yyyy-MM-dd} by {creatorName}",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            try
            {
                await _hub.Clients.User(employeeId).SendAsync("TimesheetCreated", new { timesheetId = timesheet.Id, date = timesheet.Date });
            }
            catch { }

            return await GetTimesheetDtoAsync(timesheet.Id);
        }

        public async Task<TimesheetDto?> GetTimesheetByIdAsync(int id, string currentUserId)
        {
            var timesheet = await _context.Timesheets
                .Include(t => t.Employee)
                .Include(t => t.ApprovedBy)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (timesheet == null)
                return null;

            // Employees can only view their own timesheets; role-based access is enforced at controller level
            if (timesheet.EmployeeId != currentUserId)
                return null;

            return MapToDto(timesheet);
        }

        public async Task<List<TimesheetDto>> GetEmployeeTimesheetsAsync(string employeeId, string currentUserId, DateTime? startDate = null, DateTime? endDate = null)
        {
            // For employees, restrict to their own; managers/HR access is enforced via controller authorization
            if (employeeId != currentUserId)
            {
                // Not the same user; allow retrieval (manager/HR scenarios) and rely on controller [Authorize(Roles=...)]
            }
 
            var query = _context.Timesheets
                .Include(t => t.Employee)
                .Include(t => t.ApprovedBy)
                .Where(t => t.EmployeeId == employeeId);

            if (startDate.HasValue)
                query = query.Where(t => t.Date >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.Date <= endDate.Value);

            var timesheets = await query
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return timesheets.Select(MapToDto).ToList();
        }

        public async Task<TimesheetDto?> UpdateTimesheetAsync(int id, string currentUserId, UpdateTimesheetDto updateDto)
        {
            var timesheet = await _context.Timesheets.FindAsync(id);
            if (timesheet == null)
                return null;

            // Only the employee who created the timesheet can update it
            if (timesheet.EmployeeId != currentUserId)
                return null;

            // Can only update draft or rejected timesheets
            if (timesheet.Status != TimesheetStatus.Draft && timesheet.Status != TimesheetStatus.Rejected)
                return null;

            timesheet.Date = updateDto.Date;
            timesheet.HoursWorked = updateDto.HoursWorked;
            timesheet.OvertimeHours = updateDto.OvertimeHours;
            timesheet.BreakHours = updateDto.BreakHours;
            timesheet.ProjectName = updateDto.ProjectName;
            timesheet.TaskDescription = updateDto.TaskDescription;
            timesheet.Comments = updateDto.Comments;
            timesheet.Period = updateDto.Period;
            timesheet.WeekStartDate = updateDto.WeekStartDate;
            timesheet.WeekEndDate = updateDto.WeekEndDate;
            timesheet.ModifiedDate = DateTime.UtcNow;

            // Reset status to draft if it was rejected
            if (timesheet.Status == TimesheetStatus.Rejected)
            {
                timesheet.Status = TimesheetStatus.Draft;
                timesheet.RejectionReason = null;
            }

            await _context.SaveChangesAsync();
            // Audit: Timesheet updated
            var updaterName = await GetUserDisplayNameAsync(currentUserId);
            _context.UserAudits.Add(new UserAudit
            {
                UserId = timesheet.EmployeeId,
                EventType = "TimesheetUpdated",
                Details = $"Timesheet {timesheet.Id} updated by {updaterName}",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            try
            {
                await _hub.Clients.User(timesheet.EmployeeId).SendAsync("TimesheetUpdated", new { timesheetId = timesheet.Id });
            }
            catch { }
            return await GetTimesheetDtoAsync(id);
        }

        public async Task<TimesheetDto?> SubmitTimesheetAsync(int id, string currentUserId)
        {
            var timesheet = await _context.Timesheets.FindAsync(id);
            if (timesheet == null)
                return null;

            // Only the employee who created the timesheet can submit it
            if (timesheet.EmployeeId != currentUserId)
                return null;

            // Can only submit draft timesheets
            if (timesheet.Status != TimesheetStatus.Draft)
                return null;

            timesheet.Status = TimesheetStatus.Submitted;
            timesheet.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            // Audit: Timesheet submitted
            var submitterName = await GetUserDisplayNameAsync(currentUserId);
            _context.UserAudits.Add(new UserAudit
            {
                UserId = timesheet.EmployeeId,
                EventType = "TimesheetSubmitted",
                Details = $"Timesheet {timesheet.Id} submitted by {submitterName}",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            try
            {
                await _hub.Clients.User(timesheet.EmployeeId).SendAsync("TimesheetSubmitted", new { timesheetId = timesheet.Id });
                // Notify managers for review
                await _hub.Clients.Groups("Managers").SendAsync("TimesheetSubmitted", new { timesheetId = timesheet.Id, employeeId = timesheet.EmployeeId, date = timesheet.Date });
            }
            catch { }
            return await GetTimesheetDtoAsync(id);
        }

        public async Task<TimesheetDto?> ApproveTimesheetAsync(int id, string approverId, ApproveTimesheetDto approveDto)
        {
            var timesheet = await _context.Timesheets.FindAsync(id);
            if (timesheet == null)
                return null;

            var approver = await _userManager.FindByIdAsync(approverId);
            var roles = approver != null ? await _userManager.GetRolesAsync(approver) : new List<string>();
            var isManager = roles.Contains("Manager");
            var isHR = roles.Contains("HRAdmin");
            var isSystemAdmin = roles.Contains("SystemAdmin");

            timesheet.ModifiedDate = DateTime.UtcNow;

            if (approveDto.IsApproved)
            {
                if (isManager)
                {
                    // Manager approves first stage
                    if (timesheet.Status != TimesheetStatus.Submitted)
                        return null;

                    timesheet.Status = TimesheetStatus.ManagerApproved;
                    timesheet.RejectionReason = null;
                    await _context.SaveChangesAsync();

                    // Audit
                    var approverName = await GetUserDisplayNameAsync(approverId);
                    _context.UserAudits.Add(new UserAudit
                    {
                        UserId = timesheet.EmployeeId,
                        EventType = "TimesheetManagerApproved",
                        Details = $"Timesheet {timesheet.Id} manager-approved by {approverName}",
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();

                    // Notify HR for next stage
                    try { await _hub.Clients.Groups("HRAdmin").SendAsync("TimesheetManagerApproved", new { timesheetId = timesheet.Id, employeeId = timesheet.EmployeeId, approvedById = approverId }); } catch { }
                    return await GetTimesheetDtoAsync(id);
                }
                else if (isHR || isSystemAdmin)
                {
                    // HR or SystemAdmin final approval (HR override allowed from Submitted as special case)
                    if (timesheet.Status != TimesheetStatus.ManagerApproved && timesheet.Status != TimesheetStatus.Submitted)
                        return null;

                    timesheet.Status = TimesheetStatus.Approved;
                    timesheet.RejectionReason = null;
                    timesheet.ApprovedById = approverId;
                    timesheet.ApprovedDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    // Audit
                    var approverName = await GetUserDisplayNameAsync(approverId);
                    _context.UserAudits.Add(new UserAudit
                    {
                        UserId = timesheet.EmployeeId,
                        EventType = "TimesheetApproved",
                        Details = $"Timesheet {timesheet.Id} approved by {approverName}{(timesheet.Status == TimesheetStatus.Submitted ? " (Manager step skipped)" : string.Empty)}",
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();

                    // Notify employee final decision
                    try { await _hub.Clients.User(timesheet.EmployeeId).SendAsync("TimesheetApproved", new { timesheetId = timesheet.Id }); } catch { }
                    return await GetTimesheetDtoAsync(id);
                }
                else
                {
                    return null;
                }
            }
            else
            {
                // Rejections at either stage go back to employee
                if (isManager)
                {
                    if (timesheet.Status != TimesheetStatus.Submitted)
                        return null;
                }
                else if (isHR || isSystemAdmin)
                {
                    if (timesheet.Status != TimesheetStatus.ManagerApproved && timesheet.Status != TimesheetStatus.Submitted)
                        return null;
                }
                else
                {
                    return null;
                }

                timesheet.Status = TimesheetStatus.Rejected;
                timesheet.RejectionReason = approveDto.RejectionReason;
                await _context.SaveChangesAsync();

                var approverName = await GetUserDisplayNameAsync(approverId);
                _context.UserAudits.Add(new UserAudit
                {
                    UserId = timesheet.EmployeeId,
                    EventType = "TimesheetRejected",
                    Details = $"Timesheet {timesheet.Id} rejected by {approverName}. Reason: {approveDto.RejectionReason}",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();

                try { await _hub.Clients.User(timesheet.EmployeeId).SendAsync("TimesheetRejected", new { timesheetId = timesheet.Id, reason = timesheet.RejectionReason }); } catch { }
                return await GetTimesheetDtoAsync(id);
            }
        }

        public async Task<List<TimesheetDto>> GetPendingApprovalsAsync(string currentUserId)
        {
            // Return items based on caller role: Managers -> Submitted; HR -> ManagerApproved + Submitted (override); SystemAdmin -> both
            var user = await _userManager.FindByIdAsync(currentUserId);
            var roles = user != null ? await _userManager.GetRolesAsync(user) : new List<string>();
            var isManager = roles.Contains("Manager");
            var isHR = roles.Contains("HRAdmin");
            var isSystemAdmin = roles.Contains("SystemAdmin");

            IQueryable<Timesheet> query = _context.Timesheets
                .Include(t => t.Employee)
                .Include(t => t.ApprovedBy);

            if (isManager && !(isHR || isSystemAdmin))
            {
                query = query.Where(t => t.Status == TimesheetStatus.Submitted);
            }
            else if (isHR && !isSystemAdmin)
            {
                query = query.Where(t => t.Status == TimesheetStatus.ManagerApproved || t.Status == TimesheetStatus.Submitted);
            }
            else
            {
                // SystemAdmin sees both
                query = query.Where(t => t.Status == TimesheetStatus.Submitted || t.Status == TimesheetStatus.ManagerApproved);
            }

            var timesheets = await query
                .OrderBy(t => t.CreatedDate)
                .ToListAsync();

            return timesheets.Select(MapToDto).ToList();
        }

        public async Task<bool> DeleteTimesheetAsync(int id, string currentUserId)
        {
            var timesheet = await _context.Timesheets.FindAsync(id);
            if (timesheet == null)
                return false;

            // Only the employee who created the timesheet can delete it
            if (timesheet.EmployeeId != currentUserId)
                return false;

            // Can only delete draft timesheets
            if (timesheet.Status != TimesheetStatus.Draft)
                return false;

            _context.Timesheets.Remove(timesheet);
            await _context.SaveChangesAsync();
            // Audit: Timesheet deleted
            var deleterName = await GetUserDisplayNameAsync(currentUserId);
            _context.UserAudits.Add(new UserAudit
            {
                UserId = timesheet.EmployeeId,
                EventType = "TimesheetDeleted",
                Details = $"Timesheet {timesheet.Id} deleted by {deleterName}",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            try
            {
                await _hub.Clients.User(timesheet.EmployeeId).SendAsync("TimesheetDeleted", new { timesheetId = timesheet.Id });
            }
            catch { }
            return true;
        }

        public async Task<TimesheetReportDto> GetEmployeeReportAsync(string employeeId, DateTime startDate, DateTime endDate)
        {
            var cacheKey = $"emp-report:{employeeId}:{startDate:yyyyMMdd}:{endDate:yyyyMMdd}";
            if (_cache.TryGetValue(cacheKey, out TimesheetReportDto? cached) && cached != null)
                return cached;

            var employee = await _context.Users.FindAsync(employeeId);
            if (employee == null)
                throw new ArgumentException("Employee not found");

            var timesheets = await _context.Timesheets
                .Include(t => t.Employee)
                .Include(t => t.ApprovedBy)
                .Where(t => t.EmployeeId == employeeId && 
                           t.Date >= startDate && 
                           t.Date <= endDate &&
                           t.Status == TimesheetStatus.Approved)
                .OrderBy(t => t.Date)
                .ToListAsync();

            var report = new TimesheetReportDto
            {
                EmployeeId = employeeId,
                EmployeeName = $"{employee.FirstName} {employee.LastName}",
                StartDate = startDate,
                EndDate = endDate,
                TotalHours = timesheets.Sum(t => t.HoursWorked),
                TotalOvertimeHours = timesheets.Sum(t => t.OvertimeHours ?? 0),
                TotalDays = timesheets.Count,
                Timesheets = timesheets.Select(MapToDto).ToList()
            };

            // cache short-lived
            _cache.Set(cacheKey, report, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            });
            return report;
        }

        public async Task<List<TimesheetReportDto>> GetTeamReportAsync(string managerId, DateTime startDate, DateTime endDate)
        {
            // In a real application, you'd have team relationships and role assignments
            // For now, get all confirmed users (placeholder for employees)
            var cacheKey = $"team-report:{startDate:yyyyMMdd}:{endDate:yyyyMMdd}";
            if (_cache.TryGetValue(cacheKey, out List<TimesheetReportDto>? cached) && cached != null)
                return cached;

            var employees = await _context.Users
                .Where(u => u.EmailConfirmed)
                .ToListAsync();

            var reports = new List<TimesheetReportDto>();

            foreach (var employee in employees)
            {
                var report = await GetEmployeeReportAsync(employee.Id, startDate, endDate);
                reports.Add(report);
            }

            _cache.Set(cacheKey, reports, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
            });
            return reports;
        }

        private async Task<TimesheetDto> GetTimesheetDtoAsync(int id)
        {
            var timesheet = await _context.Timesheets
                .Include(t => t.Employee)
                .Include(t => t.ApprovedBy)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (timesheet == null)
                throw new ArgumentException("Timesheet not found");

            return MapToDto(timesheet);
        }

        private static TimesheetDto MapToDto(Timesheet timesheet)
        {
            return new TimesheetDto
            {
                Id = timesheet.Id,
                EmployeeId = timesheet.EmployeeId,
                EmployeeName = $"{timesheet.Employee?.FirstName} {timesheet.Employee?.LastName}",
                Date = timesheet.Date,
                HoursWorked = timesheet.HoursWorked,
                OvertimeHours = timesheet.OvertimeHours,
                BreakHours = timesheet.BreakHours,
                ProjectName = timesheet.ProjectName,
                TaskDescription = timesheet.TaskDescription,
                Comments = timesheet.Comments,
                Status = timesheet.Status,
                ApprovedById = timesheet.ApprovedById,
                ApprovedByName = timesheet.ApprovedBy != null ? $"{timesheet.ApprovedBy.FirstName} {timesheet.ApprovedBy.LastName}" : null,
                ApprovedDate = timesheet.ApprovedDate,
                RejectionReason = timesheet.RejectionReason,
                CreatedDate = timesheet.CreatedDate,
                ModifiedDate = timesheet.ModifiedDate,
                Period = timesheet.Period,
                WeekStartDate = timesheet.WeekStartDate,
                WeekEndDate = timesheet.WeekEndDate
            };
        }
    }
}
