using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanzasApp.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class AgregaIconoACategoria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icono",
                table: "categorias",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Icono",
                table: "categorias");
        }
    }
}
