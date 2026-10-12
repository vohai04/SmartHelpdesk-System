using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PersistentNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EventId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientId = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketId = table.Column<Guid>(type: "uuid", nullable: true),
                    MessageId = table.Column<string>(type: "text", nullable: true),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Read = table.Column<bool>(type: "boolean", nullable: false),
                    Dismissed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotifications", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_EventId_RecipientId",
                table: "UserNotifications",
                columns: new[] { "EventId", "RecipientId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_RecipientId_Date",
                table: "UserNotifications",
                columns: new[] { "RecipientId", "Date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserNotifications");
        }
    }
}
