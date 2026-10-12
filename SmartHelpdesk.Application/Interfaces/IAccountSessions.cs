namespace SmartHelpdesk.Application.Interfaces;
public interface IAccountSessions { Task RevokeAsync(Guid userId); }
