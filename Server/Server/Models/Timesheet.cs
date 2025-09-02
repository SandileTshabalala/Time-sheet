using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Server.Models.Entities;

namespace Server.Models
{
    public class Timesheet
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string EmployeeId { get; set; } = string.Empty;
        
        [ForeignKey("EmployeeId")]
        public virtual User Employee { get; set; } = null!;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [Range(0, 24)]
        public decimal HoursWorked { get; set; }

        [Range(0, 24)]
        public decimal? OvertimeHours { get; set; }

        [Range(0, 24)]
        public decimal? BreakHours { get; set; }

        [StringLength(100)]
        public string? ProjectName { get; set; }

        [StringLength(200)]
        public string? TaskDescription { get; set; }

        [StringLength(500)]
        public string? Comments { get; set; }

        [Required]
        public TimesheetStatus Status { get; set; } = TimesheetStatus.Draft;

        public string? ApprovedById { get; set; }
        
        [ForeignKey("ApprovedById")]
        public virtual User? ApprovedBy { get; set; }

        // Current approver assignment for pending items (does not affect historical approvals)
        public string? ApproverId { get; set; }
        
        [ForeignKey("ApproverId")]
        public virtual User? Approver { get; set; }

        public DateTime? ApprovedDate { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? ModifiedDate { get; set; }

        [Required]
        public TimesheetPeriod Period { get; set; } = TimesheetPeriod.Daily;

        public DateTime? WeekStartDate { get; set; }
        public DateTime? WeekEndDate { get; set; }
    }

    public enum TimesheetStatus
    {
        Draft = 0,
        Submitted = 1,
        Approved = 2,
        Rejected = 3,
        Resubmitted = 4,
        ManagerApproved = 5
    }

    public enum TimesheetPeriod
    {
        Daily = 0,
        Weekly = 1,
        Monthly = 2
    }
}
 