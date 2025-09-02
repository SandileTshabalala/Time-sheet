using Server.Models;
using Server.Models.DTOs;

namespace Server.Services
{
    public interface ITimesheetService
    {
        Task<TimesheetDto> CreateTimesheetAsync(string employeeId, CreateTimesheetDto createDto);
        Task<TimesheetDto?> GetTimesheetByIdAsync(int id, string currentUserId);
        Task<List<TimesheetDto>> GetEmployeeTimesheetsAsync(string employeeId, string currentUserId, DateTime? startDate = null, DateTime? endDate = null);
        Task<TimesheetDto?> UpdateTimesheetAsync(int id, string currentUserId, UpdateTimesheetDto updateDto);
        Task<TimesheetDto?> SubmitTimesheetAsync(int id, string currentUserId);
        Task<TimesheetDto?> ApproveTimesheetAsync(int id, string approverId, ApproveTimesheetDto approveDto);
        Task<List<TimesheetDto>> GetPendingApprovalsAsync(string currentUserId);
        Task<bool> DeleteTimesheetAsync(int id, string currentUserId);
        Task<TimesheetReportDto> GetEmployeeReportAsync(string employeeId, DateTime startDate, DateTime endDate);
        Task<List<TimesheetReportDto>> GetTeamReportAsync(string managerId, DateTime startDate, DateTime endDate);
    }
}
