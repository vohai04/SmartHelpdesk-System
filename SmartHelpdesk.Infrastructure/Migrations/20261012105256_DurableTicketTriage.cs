using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DurableTicketTriage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Priority",
                table: "Tickets",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "PrioritySource",
                table: "Tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TriageStatus",
                table: "Tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("UPDATE \"Tickets\" SET \"TriageStatus\" = 3 WHERE \"IsAiTriaged\" = TRUE;");

            migrationBuilder.CreateTable(
                name: "TicketJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    NextAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LeaseId = table.Column<Guid>(type: "uuid", nullable: true),
                    LastError = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketJobs_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketJobs_Kind_Status_NextAttemptAt",
                table: "TicketJobs",
                columns: new[] { "Kind", "Status", "NextAttemptAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketJobs_TicketId",
                table: "TicketJobs",
                column: "TicketId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketJobs");

            migrationBuilder.DropColumn(
                name: "PrioritySource",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "TriageStatus",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Tickets");

            migrationBuilder.AlterColumn<int>(
                name: "Priority",
                table: "Tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
