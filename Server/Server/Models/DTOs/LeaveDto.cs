using System;

namespace Server.Models.DTOs
{
    public class LeaveDto
    {
        public int Id { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string? ApprovedById { get; set; }
        public string? ApprovedByName { get; set; }
        public string Type { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int Days { get; set; }
        public string? Reason { get; set; }
        // Client-friendly status mapping (Pending->Submitted(1), Approved->Approved(3), Rejected->Rejected(4))
        public int Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? ApprovedDate { get; set; }
    }
}
