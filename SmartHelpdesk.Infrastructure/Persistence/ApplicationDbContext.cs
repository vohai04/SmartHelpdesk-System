using Microsoft.EntityFrameworkCore;
using SmartHelpdesk.Domain.Entities;

namespace SmartHelpdesk.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Ticket> Tickets => Set<Ticket>();
        public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();
        public DbSet<Attachment> Attachments => Set<Attachment>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configure Categories
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            });

            // Configure Tickets
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(250);
                
                // Relationships
                entity.HasOne(t => t.Category)
                      .WithMany(c => c.Tickets)
                      .HasForeignKey(t => t.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.CreatedBy)
                      .WithMany(u => u.CreatedTickets)
                      .HasForeignKey(t => t.CreatedById)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.AssignedTo)
                      .WithMany(u => u.AssignedTickets)
                      .HasForeignKey(t => t.AssignedToId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure TicketMessage
            modelBuilder.Entity<TicketMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired();

                entity.HasOne(tm => tm.Ticket)
                      .WithMany(t => t.Messages)
                      .HasForeignKey(tm => tm.TicketId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(tm => tm.Sender)
                      .WithMany()
                      .HasForeignKey(tm => tm.SenderId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Attachment
            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileName).IsRequired().HasMaxLength(250);
                entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);

                entity.HasOne<Ticket>()
                      .WithMany(t => t.Attachments)
                      .HasForeignKey(a => a.TicketId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<TicketMessage>()
                      .WithMany(tm => tm.Attachments)
                      .HasForeignKey(a => a.TicketMessageId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
            
            // Configure AuditLog
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.EntityName).IsRequired().HasMaxLength(100);
            });
        }
    }
}
