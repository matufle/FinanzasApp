using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanzasApp.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class AgregaSuscripcionesPush : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "suscripciones_push",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ClaveP256dh = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false, defaultValue: ""),
                    ClaveAuth = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: ""),
                    Dispositivo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false, defaultValue: ""),
                    UltimoEnvio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suscripciones_push", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_suscripciones_push_Endpoint",
                table: "suscripciones_push",
                column: "Endpoint",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "suscripciones_push");
        }
    }
}
