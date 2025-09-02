using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models.Entities
{
    public enum LeaveStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }

    public enum LeaveType
    {
        Annual,
        Sick,
        Unpaid,
        Other
    }

    public class LeaveRequest
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string EmployeeId { get; set; } = string.Empty;
        public LeaveType Type { get; set; } = LeaveType.Annual;
        [Required]
        public DateTime StartDate { get; set; }
        [Required]
        public DateTime EndDate { get; set; }
        public string? Reason { get; set; }
        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
        public string? ApproverId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ModifiedAt { get; set; }

        [ForeignKey(nameof(EmployeeId))]
        public User? Employee { get; set; }

        [ForeignKey(nameof(ApproverId))]
        public User? Approver { get; set; }
    }
}
