using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Models.DTOs;
using Server.Services;
using System.Security.Claims;
using System.Globalization;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TimesheetController : ControllerBase
    {
        private readonly ITimesheetService _timesheetService;
        private readonly ILogger<TimesheetController> _logger;

        public TimesheetController(ITimesheetService timesheetService, ILogger<TimesheetController> logger)
        {
            _timesheetService = timesheetService;
            _logger = logger;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
 
        [HttpPost] 
        public async Task<ActionResult<TimesheetDto>> CreateTimesheet([FromBody] CreateTimesheetDto createDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Invalid user");

                var timesheet = await _timesheetService.CreateTimesheetAsync(userId, createDto);
                return CreatedAtAction(nameof(GetTimesheet), new { id = timesheet.Id }, timesheet);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating timesheet");
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TimesheetDto>> GetTimesheet(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var timesheet = await _timesheetService.GetTimesheetByIdAsync(id, userId);
                
                if (timesheet == null)
                    return NotFound();

                return Ok(timesheet);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting timesheet {TimesheetId}", id);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<List<TimesheetDto>>> GetEmployeeTimesheets(string employeeId, 
            [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var timesheets = await _timesheetService.GetEmployeeTimesheetsAsync(employeeId, currentUserId, startDate, endDate);
                return Ok(timesheets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employee timesheets for {EmployeeId}", employeeId);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("my-timesheets")]
        public async Task<ActionResult<List<TimesheetDto>>> GetMyTimesheets(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized("Invalid user");

                var timesheets = await _timesheetService.GetEmployeeTimesheetsAsync(userId, userId, startDate, endDate);
                return Ok(timesheets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user timesheets");
                return BadRequest(ex.Message);
            }
        }
 
        [HttpPut("{id}")]
        public async Task<ActionResult<TimesheetDto>> UpdateTimesheet(int id, [FromBody] UpdateTimesheetDto updateDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var timesheet = await _timesheetService.UpdateTimesheetAsync(id, userId, updateDto);
                
                if (timesheet == null)
                    return NotFound();

                return Ok(timesheet);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating timesheet {TimesheetId}", id);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("{id}/submit")]
        public async Task<ActionResult<TimesheetDto>> SubmitTimesheet(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var timesheet = await _timesheetService.SubmitTimesheetAsync(id, userId);
                
                if (timesheet == null)
                    return NotFound();

                return Ok(timesheet);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting timesheet {TimesheetId}", id);
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Manager,HRAdmin,SystemAdmin")]
        public async Task<ActionResult<TimesheetDto>> ApproveTimesheet(int id, [FromBody] ApproveTimesheetDto approveDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var timesheet = await _timesheetService.ApproveTimesheetAsync(id, userId, approveDto);
                
                if (timesheet == null)
                    return NotFound();

                return Ok(timesheet);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving timesheet {TimesheetId}", id);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("pending-approval")]
        [Authorize(Roles = "Manager,HRAdmin,SystemAdmin")]
        public async Task<ActionResult<List<TimesheetDto>>> GetPendingApprovals()
        {
            try
            {
                var userId = GetCurrentUserId();
                var timesheets = await _timesheetService.GetPendingApprovalsAsync(userId);
                return Ok(timesheets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending approvals");
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTimesheet(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var success = await _timesheetService.DeleteTimesheetAsync(id, userId);
                
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting timesheet {TimesheetId}", id);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("reports/employee/{employeeId}")]
        [Authorize(Roles = "Manager,HRAdmin,SystemAdmin")]
        public async Task<ActionResult<TimesheetReportDto>> GetEmployeeReport(string employeeId, 
            [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var report = await _timesheetService.GetEmployeeReportAsync(employeeId, startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating employee report for {EmployeeId}", employeeId);
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("reports/team")]
        [Authorize(Roles = "Manager,HRAdmin,SystemAdmin")]
        public async Task<ActionResult<List<TimesheetReportDto>>> GetTeamReport(
            [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var userId = GetCurrentUserId();
                var reports = await _timesheetService.GetTeamReportAsync(userId, startDate, endDate);
                return Ok(reports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating team report");
                return BadRequest(ex.Message);
            }
        }
    }
}
