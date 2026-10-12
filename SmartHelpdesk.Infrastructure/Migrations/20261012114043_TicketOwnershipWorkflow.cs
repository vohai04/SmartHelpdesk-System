using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHelpdesk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TicketOwnershipWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClosureReason",
                table: "Tickets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Resolution",
                table: "Tickets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransferReason",
                table: "Tickets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TransferRequestedAt",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TransferRequestedById",
                table: "Tickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TransferTargetId",
                table: "Tickets",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Message",
                table: "TicketJobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MessageId",
                table: "TicketJobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RecipientId",
                table: "TicketJobs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "TicketJobs",
                type: "text",
                nullable: true);
            migrationBuilder.Sql("UPDATE \"Tickets\" SET \"StartedAt\"=COALESCE(\"UpdatedAt\",\"CreatedAt\") WHERE \"Status\"<>0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClosureReason",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "Resolution",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "TransferReason",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "TransferRequestedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "TransferRequestedById",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "TransferTargetId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "Message",
                table: "TicketJobs");

            migrationBuilder.DropColumn(
                name: "MessageId",
                table: "TicketJobs");

            migrationBuilder.DropColumn(
                name: "RecipientId",
                table: "TicketJobs");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "TicketJobs");
        }
    }
}
