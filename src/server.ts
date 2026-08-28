import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { ReservationService } from "./modules/reservations/services/reservation.service.js";

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);

  const reservationService = new ReservationService();
  // Ejecutar verificación inicial de estatus de limpieza al arrancar
  reservationService.autoUpdateCleaningStatuses();

  // Programar actualización automática cada minuto (para actualizar automáticamente a las 12:00 PM y en estancias >3 días)
  setInterval(() => {
    reservationService.autoUpdateCleaningStatuses();
  }, 60 * 1000);
});
