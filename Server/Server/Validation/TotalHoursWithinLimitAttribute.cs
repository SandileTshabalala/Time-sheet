using System;
using System.ComponentModel.DataAnnotations;
using Server.Models;

[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public class TotalHoursWithinLimitAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null) 
            return ValidationResult.Success;

        // We assume DTO has these properties
        var type = value.GetType();
        var periodProp = type.GetProperty("Period");
        var hoursWorkedProp = type.GetProperty("HoursWorked");
        var overtimeProp = type.GetProperty("OvertimeHours");
        var breakProp = type.GetProperty("BreakHours");

        if (periodProp == null || hoursWorkedProp == null)
            return new ValidationResult("DTO is missing required properties for total hours validation.");

        var period = (TimesheetPeriod)periodProp.GetValue(value);
        var hoursWorked = Convert.ToDecimal(hoursWorkedProp.GetValue(value) ?? 0);
        var overtimeHours = Convert.ToDecimal(overtimeProp?.GetValue(value) ?? 0);
        var breakHours = Convert.ToDecimal(breakProp?.GetValue(value) ?? 0);

        // Non-negative validation
        if (hoursWorked < 0)
        {
            return new ValidationResult("HoursWorked cannot be negative.");
        }
        if (overtimeHours < 0)
        {
            return new ValidationResult("OvertimeHours cannot be negative.");
        }
        if (breakHours < 0)
        {
            return new ValidationResult("BreakHours cannot be negative.");
        }

        decimal maxHours = period switch
        {
            TimesheetPeriod.Daily => 24,
            TimesheetPeriod.Weekly => 168,
            TimesheetPeriod.Monthly => 744,
            _ => 24
        };

        if (hoursWorked + overtimeHours > maxHours)
        {
            return new ValidationResult($"Total hours (HoursWorked + OvertimeHours) cannot exceed {maxHours} for {period} timesheets.");
        }

        return ValidationResult.Success;
    }
}
