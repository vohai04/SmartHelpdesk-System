using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Domain.Entities;
using SmartHelpdesk.Domain.Enums;

namespace SmartHelpdesk.Infrastructure.Persistence
{
    public static class ApplicationDbContextSeed
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            try
            {
                if (!context.Users.Any())
                {
                    // 1. Seed Categories
                    var catTechSupport = new Category { Id = Guid.NewGuid(), Name = "Hỗ trợ kỹ thuật", Description = "Lỗi phần mềm, ứng dụng crash, không thể đăng nhập..." };
                    var catBilling = new Category { Id = Guid.NewGuid(), Name = "Tài khoản & Thanh toán", Description = "Gia hạn dịch vụ, nâng cấp gói, hóa đơn..." };
                    var catFeature = new Category { Id = Guid.NewGuid(), Name = "Yêu cầu tính năng", Description = "Đề xuất tính năng mới cho hệ thống..." };
                    var catHardware = new Category { Id = Guid.NewGuid(), Name = "Bảo hành thiết bị", Description = "Đổi trả máy móc, thiết bị phần cứng hỏng..." };
                    
                    context.Categories.AddRange(catTechSupport, catBilling, catFeature, catHardware);

                    // 2. Seed Users
                    var admin = new User { Id = Guid.NewGuid(), FullName = "System Admin", Email = "admin@smarthelpdesk.com", PasswordHash = "admin123", Role = UserRole.Admin, IsActive = true };
                    var agent1 = new User { Id = Guid.NewGuid(), FullName = "Nguyễn Hỗ Trợ 1", Email = "agent1@smarthelpdesk.com", PasswordHash = "agent123", Role = UserRole.Agent, IsActive = true };
                    var agent2 = new User { Id = Guid.NewGuid(), FullName = "Trần Hỗ Trợ 2", Email = "agent2@smarthelpdesk.com", PasswordHash = "agent123", Role = UserRole.Agent, IsActive = true };
                    var customer1 = new User { Id = Guid.NewGuid(), FullName = "Khách Hàng VIP", Email = "customer.vip@gmail.com", PasswordHash = "cust123", Role = UserRole.Customer, IsActive = true };
                    var customer2 = new User { Id = Guid.NewGuid(), FullName = "Công ty ABC", Email = "contact@abc.com", PasswordHash = "cust123", Role = UserRole.Customer, IsActive = true };
                    
                    context.Users.AddRange(admin, agent1, agent2, customer1, customer2);

                    // 3. Seed Tickets
                    var ticket1 = new Ticket 
                    { 
                        Id = Guid.NewGuid(), 
                        Title = "Không thể đăng nhập vào hệ thống CRM", 
                        Description = "Chào bạn, sáng nay tôi không thể đăng nhập vào hệ thống CRM được, nó cứ báo lỗi 500.", 
                        Status = TicketStatus.Open, 
                        Priority = TicketPriority.High, 
                        CategoryId = catTechSupport.Id, 
                        CreatedById = customer1.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    };

                    var ticket2 = new Ticket 
                    { 
                        Id = Guid.NewGuid(), 
                        Title = "Xin nâng cấp gói dịch vụ lên Enterprise", 
                        Description = "Mình cần nâng cấp gói để thêm 50 user nữa, cho mình xin báo giá nhé.", 
                        Status = TicketStatus.InProgress, 
                        Priority = TicketPriority.Medium, 
                        CategoryId = catBilling.Id, 
                        CreatedById = customer2.Id,
                        AssignedToId = agent1.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    };

                    var ticket3 = new Ticket 
                    { 
                        Id = Guid.NewGuid(), 
                        Title = "Lỗi in hóa đơn bị lệch lề", 
                        Description = "Mỗi lần xuất file PDF hóa đơn nó đều bị lệch lề trái mất 2cm.", 
                        Status = TicketStatus.Resolved, 
                        Priority = TicketPriority.Low, 
                        CategoryId = catTechSupport.Id, 
                        CreatedById = customer1.Id,
                        AssignedToId = agent2.Id,
                        CreatedAt = DateTime.UtcNow.AddDays(-5)
                    };

                    context.Tickets.AddRange(ticket1, ticket2, ticket3);

                    // 4. Seed Messages for Ticket 2
                    var msg1 = new TicketMessage
                    {
                        Id = Guid.NewGuid(),
                        TicketId = ticket2.Id,
                        SenderId = agent1.Id,
                        Content = "Chào bạn, mình đã nhận được yêu cầu. Dưới đây là bảng giá gói Enterprise...",
                        CreatedAt = DateTime.UtcNow.AddHours(-20)
                    };
                    var msg2 = new TicketMessage
                    {
                        Id = Guid.NewGuid(),
                        TicketId = ticket2.Id,
                        SenderId = customer2.Id,
                        Content = "Cảm ơn bạn, mình sẽ trình sếp duyệt rồi phản hồi lại sau nhé.",
                        CreatedAt = DateTime.UtcNow.AddHours(-18)
                    };

                    context.TicketMessages.AddRange(msg1, msg2);

                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Lỗi khi tạo dữ liệu mẫu: " + ex.Message);
            }
        }
    }
}
