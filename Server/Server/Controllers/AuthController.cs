using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Server.Models.Entities;
using Server.Models.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Server.Services;
using Server.DataBase;

namespace Server.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly TokenService _tokenService;
        private readonly AppDBContext _context;

        public AuthController(UserManager<User> userManager, RoleManager<Role> roleManager, IConfiguration configuration, TokenService tokenService, AppDBContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _tokenService = tokenService;
            _context = context;
        }

        //login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized("Invalid email or password");

            if (!user.IsActive)
                return Unauthorized("Account is deactivated");

            var roles = await _userManager.GetRolesAsync(user);
            // read flag directly from user
            var mustChangePassword = user.MustChangePassword;

            string token;
            string? refreshTokenValue = null;
            DateTime? expiration;

            if (mustChangePassword)
            {
                // Short-lived access token (e.g., 10 minutes) and no refresh token while password must be changed
                token = _tokenService.GenerateAccessToken(user, roles, 10);
                expiration = DateTime.UtcNow.AddMinutes(10);
            }
            else
            {
                token = _tokenService.GenerateAccessToken(user, roles);
                var refreshToken = _tokenService.GenerateRefreshToken();
                refreshToken.UserId = user.Id;
                _context.RefreshTokens.Add(refreshToken);
                await _context.SaveChangesAsync();
                refreshTokenValue = refreshToken.Token;
                expiration = refreshToken.Expires;
            }

            // Audit successful login
            _context.UserAudits.Add(new UserAudit
            {
                UserId = user.Id,
                EventType = "Login",
                Details = mustChangePassword ? "Login requires password change" : "Login successful",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(new {
                token = token,
                refreshToken = refreshTokenValue,
                expiration = expiration,
                user = new {
                    user.Id,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    roles,
                    user.IsActive,
                    mustChangePassword
                },
                mustChangePassword
            });
        }

        //refresh token
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request)
        {
            var existingRefreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

            if (existingRefreshToken == null || existingRefreshToken.IsExpired)
            {
                return Unauthorized(new { message = "Invalid or expired refresh token" });
            }

            var user = existingRefreshToken.User;
            if (user.MustChangePassword)
            {
                return Unauthorized(new { message = "Password change required. Please login and change your password." });
            }
            var roles = await _userManager.GetRolesAsync(user);

            var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
            var newRefreshToken = _tokenService.GenerateRefreshToken();
            newRefreshToken.UserId = user.Id;

            _context.RefreshTokens.Remove(existingRefreshToken);
            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            return Ok(new AuthResponseDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken.Token,
                Expiration = newRefreshToken.Expires
            });
        }

        public class ChangePasswordDto
        {
            public string CurrentPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        public class ForgotPasswordDto
        {
            public string Email { get; set; } = string.Empty;
        }

        public class ResetPasswordDto
        {
            public string Email { get; set; } = string.Empty;
            public string Token { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("change-password")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Unauthorized();

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            if (user.MustChangePassword)
            {
                user.MustChangePassword = false;
                await _userManager.UpdateAsync(user);
            }

            _context.UserAudits.Add(new UserAudit
            {
                UserId = user.Id,
                EventType = "PasswordChanged",
                Details = "User changed password",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return NoContent();
        }
        // not set email yet, i will use . SendGrid in future
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                return Ok(new { message = "If an account with that email exists, password reset instructions have been sent." });
            }

            if (!user.IsActive)
            {
                return Ok(new { message = "If an account with that email exists, password reset instructions have been sent." });
            }

            // Generate password reset token
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            // For demo purposes, we'll log it to console
            Console.WriteLine($"Password reset token for {user.Email}: {resetToken}");
            
            // Audit password reset request
            _context.UserAudits.Add(new UserAudit
            {
                UserId = user.Id,
                EventType = "PasswordResetRequested",
                Details = "User requested password reset",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "If an account with that email exists, password reset instructions have been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid password reset request." });
            }

            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Invalid password reset request.", errors = result.Errors.Select(e => e.Description) });
            }

            // Ensure user can login after password reset
            if (user.MustChangePassword)
            {
                user.MustChangePassword = false;
                await _userManager.UpdateAsync(user);
            }

            // Audit successful password reset
            _context.UserAudits.Add(new UserAudit
            {
                UserId = user.Id,
                EventType = "PasswordReset",
                Details = "User successfully reset password",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password has been reset successfully. You can now login with your new password." });
        }
    }
}
