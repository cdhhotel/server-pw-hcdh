import { prisma } from "./src/config/database.js";

async function main() {
  console.log("Actualizando restricción habitacion_estatus_check en PostgreSQL...");
  await prisma.$executeRawUnsafe(`
    ALTER TABLE habitacion DROP CONSTRAINT IF EXISTS habitacion_estatus_check;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE habitacion ADD CONSTRAINT habitacion_estatus_check CHECK (estatus IN ('disponible', 'mantenimiento', 'ocupada', 'limpieza', 'sucia'));
  `);
  console.log("Restricción habitacion_estatus_check actualizada exitosamente.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error al actualizar restricción:", err);
  process.exit(1);
});
