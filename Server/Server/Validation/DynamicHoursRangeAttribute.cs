using System;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using Server.Models;

public class DynamicHoursRangeAttribute : ValidationAttribute
{
    private readonly string _periodPropertyName;

    public DynamicHoursRangeAttribute(string periodPropertyName)
    {
        _periodPropertyName = periodPropertyName;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value == null)
            return ValidationResult.Success;

        // Get the Period value from the DTO
        var periodProperty = validationContext.ObjectType.GetProperty(_periodPropertyName);
        if (periodProperty == null)
            return new ValidationResult($"Unknown property: {_periodPropertyName}");

        var periodValue = periodProperty.GetValue(validationContext.ObjectInstance);
        if (periodValue == null)
            return new ValidationResult("Period is required.");

        decimal hours = Convert.ToDecimal(value);
        decimal maxHours;

        switch ((TimesheetPeriod)periodValue)
        {
            case TimesheetPeriod.Daily:
                maxHours = 24;
                break;
            case TimesheetPeriod.Weekly:
                maxHours = 168;
                break;
            case TimesheetPeriod.Monthly:
                maxHours = 744;
                break;
            default:
                return new ValidationResult("Invalid period selected.");
        }

        if (hours < 0 || hours > maxHours)
        {
            return new ValidationResult($"Value must be between 0 and {maxHours} for a {(TimesheetPeriod)periodValue} timesheet.");
        }

        return ValidationResult.Success;
    }
}
