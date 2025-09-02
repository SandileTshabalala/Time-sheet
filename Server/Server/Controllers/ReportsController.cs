using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Server.Services;
using System.Threading.Tasks;
using System;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using System.IO;

namespace Server.Controllers
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "SystemAdmin,Manager,HRAdmin")]
    [Route("api/reports")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly ITimesheetService _timesheetService;

        public ReportsController(ITimesheetService timesheetService)
        {
            _timesheetService = timesheetService;
        }

        [HttpGet("employee/{id}/export")]
        public async Task<IActionResult> ExportEmployee(string id, [FromQuery] DateTime start, [FromQuery] DateTime end, [FromQuery] string format = "excel")
        {
            var report = await _timesheetService.GetEmployeeReportAsync(id, start, end);

            if (string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
            {
                var bytes = GenerateEmployeePdf(report);
                var fileName = $"Employee_{report.EmployeeName}_{start:yyyyMMdd}_{end:yyyyMMdd}.pdf";
                return File(bytes, "application/pdf", fileName);
            }
            else
            {
                using var wb = new XLWorkbook();
                var ws = wb.AddWorksheet("Report");
                ws.Cell(1, 1).Value = "Employee"; ws.Cell(1, 2).Value = report.EmployeeName;
                ws.Cell(2, 1).Value = "Start"; ws.Cell(2, 2).Value = report.StartDate;
                ws.Cell(3, 1).Value = "End"; ws.Cell(3, 2).Value = report.EndDate;
                ws.Cell(5, 1).Value = "Date";
                ws.Cell(5, 2).Value = "Project";
                ws.Cell(5, 3).Value = "Hours";
                int row = 6;
                foreach (var t in report.Timesheets)
                {
                    ws.Cell(row, 1).Value = t.Date;
                    ws.Cell(row, 2).Value = t.ProjectName;
                    ws.Cell(row, 3).Value = t.HoursWorked;
                    row++;
                }
                ws.Cell(row + 1, 2).Value = "Total";
                ws.Cell(row + 1, 3).Value = report.TotalHours;
                using var stream = new MemoryStream();
                wb.SaveAs(stream);
                var fileName = $"Employee_{report.EmployeeName}_{start:yyyyMMdd}_{end:yyyyMMdd}.xlsx";
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
        }

        [HttpGet("team/export")]
        public async Task<IActionResult> ExportTeam([FromQuery] DateTime start, [FromQuery] DateTime end, [FromQuery] string format = "excel")
        {
            var reports = await _timesheetService.GetTeamReportAsync("", start, end);

            if (string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase))
            {
                var bytes = GenerateTeamPdf(reports);
                var fileName = $"Team_{start:yyyyMMdd}_{end:yyyyMMdd}.pdf";
                return File(bytes, "application/pdf", fileName);
            }
            else
            {
                using var wb = new XLWorkbook();
                var ws = wb.AddWorksheet("Team Report");
                ws.Cell(1, 1).Value = "Employee";
                ws.Cell(1, 2).Value = "Total Hours";
                int row = 2;
                foreach (var r in reports)
                {
                    ws.Cell(row, 1).Value = r.EmployeeName;
                    ws.Cell(row, 2).Value = r.TotalHours;
                    row++;
                }
                using var stream = new MemoryStream();
                wb.SaveAs(stream);
                var fileName = $"Team_{start:yyyyMMdd}_{end:yyyyMMdd}.xlsx";
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
        }

        private static byte[] GenerateEmployeePdf(Server.Models.DTOs.TimesheetReportDto report)
        {
            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(20);
                    page.Header().Text($"Timesheet Report - {report.EmployeeName}").Bold().FontSize(16);
                    page.Content().Column(col =>
                    {
                        col.Item().Text($"Period: {report.StartDate:yyyy-MM-dd} to {report.EndDate:yyyy-MM-dd}");
                        col.Item().Text($"Total Hours: {report.TotalHours}");
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(); // Date
                                columns.RelativeColumn(); // Project
                                columns.ConstantColumn(60); // Hours
                            });
                            table.Header(h =>
                            {
                                h.Cell().Element(CellStyle).Text("Date");
                                h.Cell().Element(CellStyle).Text("Project");
                                h.Cell().Element(CellStyle).Text("Hours");
                            });
                            foreach (var t in report.Timesheets)
                            {
                                table.Cell().Element(CellStyle).Text(t.Date.ToString("yyyy-MM-dd"));
                                table.Cell().Element(CellStyle).Text(t.ProjectName ?? "");
                                table.Cell().Element(CellStyle).Text(t.HoursWorked.ToString("0.##"));
                            }
                        });
                    });
                });
            });
            using var ms = new MemoryStream();
            doc.GeneratePdf(ms);
            return ms.ToArray();

            IContainer CellStyle(IContainer c) => c.PaddingVertical(4).PaddingHorizontal(6).Border(0.5f).BorderColor(Colors.Grey.Lighten2);
        }

        private static byte[] GenerateTeamPdf(System.Collections.Generic.List<Server.Models.DTOs.TimesheetReportDto> reports)
        {
            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(20);
                    page.Header().Text("Team Timesheet Summary").Bold().FontSize(16);
                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(); // Employee
                            columns.ConstantColumn(80); // Total Hours
                        });
                        table.Header(h =>
                        {
                            h.Cell().Element(CellStyle).Text("Employee");
                            h.Cell().Element(CellStyle).Text("Total Hours");
                        });
                        foreach (var r in reports)
                        {
                            table.Cell().Element(CellStyle).Text(r.EmployeeName ?? "");
                            table.Cell().Element(CellStyle).Text(r.TotalHours.ToString("0.##"));
                        }
                    });
                });
            });
            using var ms = new MemoryStream();
            doc.GeneratePdf(ms);
            return ms.ToArray();

            IContainer CellStyle(IContainer c) => c.PaddingVertical(4).PaddingHorizontal(6).Border(0.5f).BorderColor(Colors.Grey.Lighten2);
        }
    }
}
