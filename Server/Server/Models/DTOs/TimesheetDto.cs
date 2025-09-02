using System.ComponentModel.DataAnnotations;

namespace Server.Models.DTOs
{
    public class TimesheetDto
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal HoursWorked { get; set; }
        public decimal? OvertimeHours { get; set; }
        public decimal? BreakHours { get; set; }
        public string? ProjectName { get; set; }
        public string? TaskDescription { get; set; }
        public string? Comments { get; set; }
        public TimesheetStatus Status { get; set; }
        public string? ApprovedById { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public TimesheetPeriod Period { get; set; }
        public DateTime? WeekStartDate { get; set; }
        public DateTime? WeekEndDate { get; set; }
    }

    [TotalHoursWithinLimit]
    public class CreateTimesheetDto
    {
        [Required]
        public DateTime Date { get; set; }

        [Required]
        [DynamicHoursRange(nameof(Period))] 
        public decimal HoursWorked { get; set; }

        [DynamicHoursRange(nameof(Period))] 
        public decimal? OvertimeHours { get; set; }

        [DynamicHoursRange(nameof(Period))] 
        public decimal? BreakHours { get; set; }

        [StringLength(100)]
        public string? ProjectName { get; set; }

        [StringLength(200)]
        public string? TaskDescription { get; set; }

        [StringLength(500)]
        public string? Comments { get; set; }

        [Required]
        public TimesheetPeriod Period { get; set; } = TimesheetPeriod.Daily;

        public DateTime? WeekStartDate { get; set; }
        public DateTime? WeekEndDate { get; set; }
    }

    public class UpdateTimesheetDto
    {
        [Required]
        public DateTime Date { get; set; }

        [Required]
        [Range(0, 24, ErrorMessage = "Hours worked must be between 0 and 24")]
        public decimal HoursWorked { get; set; }

        [Range(0, 24, ErrorMessage = "Overtime hours must be between 0 and 24")]
        public decimal? OvertimeHours { get; set; }

        [Range(0, 24, ErrorMessage = "Break hours must be between 0 and 24")]
        public decimal? BreakHours { get; set; }

        [StringLength(100)]
        public string? ProjectName { get; set; }

        [StringLength(200)]
        public string? TaskDescription { get; set; }

        [StringLength(500)]
        public string? Comments { get; set; }

        [Required]
        public TimesheetPeriod Period { get; set; }

        public DateTime? WeekStartDate { get; set; }
        public DateTime? WeekEndDate { get; set; }
    }

    public class ApproveTimesheetDto
    {
        [Required]
        public bool IsApproved { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }
    }

    public class TimesheetReportDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalHours { get; set; }
        public decimal TotalOvertimeHours { get; set; }
        public int TotalDays { get; set; }
        public List<TimesheetDto> Timesheets { get; set; } = new List<TimesheetDto>();
    }
}
