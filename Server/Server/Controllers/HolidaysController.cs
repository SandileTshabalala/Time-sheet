using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Server.DataBase;
using Server.Models.Entities;

namespace Server.Controllers
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "SystemAdmin,HRAdmin")]
    [Route("api/holidays")]
    [ApiController]
    public class HolidaysController : ControllerBase
    {
        private readonly AppDBContext _context;
        public HolidaysController(AppDBContext context)
        {
            _context = context;
        }

        // GET: api/holidays?start=...&end=...
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var q = _context.Holidays.AsQueryable();
            if (start.HasValue) q = q.Where(h => h.Date >= start.Value.Date);
            if (end.HasValue) q = q.Where(h => h.Date <= end.Value.Date);
            var items = await q.OrderBy(h => h.Date).ToListAsync();
            return Ok(items);
        }

        // POST: api/holidays
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Holiday model)
        {
            if (model.Date == default) return BadRequest("Date is required");
            if (string.IsNullOrWhiteSpace(model.Name)) return BadRequest("Name is required");
            model.Id = 0;
            model.Date = model.Date.Date;
            model.CreatedAt = DateTime.UtcNow;
            _context.Holidays.Add(model);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        // DELETE: api/holidays/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var h = await _context.Holidays.FindAsync(id);
            if (h == null) return NotFound();
            _context.Holidays.Remove(h);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/holidays/import
        [HttpPost("import")]
        public async Task<IActionResult> Import([FromBody] List<Holiday> items)
        {
            if (items == null || items.Count == 0) return BadRequest("No holidays provided");
            foreach (var h in items)
            {
                h.Id = 0;
                h.Date = h.Date.Date;
                h.CreatedAt = DateTime.UtcNow;
            }
            await _context.Holidays.AddRangeAsync(items);
            await _context.SaveChangesAsync();
            return Ok(new { imported = items.Count });
        }
    }
}
