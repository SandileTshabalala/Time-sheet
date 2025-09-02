using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Server.Hubs
{
    [Authorize]
    public class NotificationsHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var user = Context.User;
            if (user?.Identity?.IsAuthenticated == true)
            {
                // Add to role-based groups for broadcast routing
                if (user.IsInRole("Manager"))
                    await Groups.AddToGroupAsync(Context.ConnectionId, "Managers");
                if (user.IsInRole("HRAdmin"))
                    await Groups.AddToGroupAsync(Context.ConnectionId, "HRAdmin");
                if (user.IsInRole("SystemAdmin"))
                    await Groups.AddToGroupAsync(Context.ConnectionId, "SystemAdmin");
            }
            await base.OnConnectedAsync();
        }
    }
}
