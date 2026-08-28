import { ReservationRepository } from "../repositories/reservation.repository.js";
import { prisma } from "../../../config/database.js";

export class ReservationService {
  constructor(private reservationRepository = new ReservationRepository()) { }

  /**
   * Actualiza automáticamente el estatus de las habitaciones a 'limpieza'
   * 1. Cuando se cumple la fecha de salida a las 12:00 PM (medio día).
   * 2. Cuando una estancia tiene 3 o más días de reservación.
   */
  async autoUpdateCleaningStatuses() {
    try {
      const now = new Date();

      // 1. Reservaciones cuyo checkout sea hoy a las 12:00 PM o previo y sigan no finalizadas
      const reservations = await (prisma as any).reservacion.findMany({
        where: {
          estado: { in: ["confirmada", "activa", "pendiente"] },
          deleted_at: null,
        },
        include: { habitacion: true },
      });

      for (const res of reservations) {
        const checkoutDate = new Date(res.fecha_salida);
        // Hora oficial de checkout: 12:00:00 PM
        checkoutDate.setHours(12, 0, 0, 0);

        if (now >= checkoutDate) {
          await (prisma as any).reservacion.update({
            where: { id: res.id },
            data: { estado: "finalizada", updated_at: now },
          });

          if (res.habitacion_id) {
            await (prisma as any).habitacion.update({
              where: { id: res.habitacion_id },
              data: { estatus: "limpieza", updated_at: now },
            });
          }
        } else {
          // 2. Estancias de 3 o más días
          const checkInDate = new Date(res.fecha_entrada);
          const totalStayDays = Math.ceil((checkoutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
          const elapsedDays = Math.floor((now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

          if (totalStayDays >= 3 && elapsedDays >= 3 && now.getHours() >= 12) {
            if (res.habitacion_id && res.habitacion?.estatus !== "limpieza") {
              await (prisma as any).habitacion.update({
                where: { id: res.habitacion_id },
                data: { estatus: "limpieza", updated_at: now },
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("[autoUpdateCleaningStatuses] Error:", err);
    }
  }

  /**
   * Permite consultar una reservación por folio y correo electrónico
   */
  async getByFolioAndEmail(folio: string, email: string) {
    if (!folio || !email) {
      throw new Error("El folio y el correo electrónico son obligatorios para la consulta.");
    }

    const reservacion = await this.reservationRepository.findByEmailAndFolio(folio, email);
    if (!reservacion) {
      throw new Error("No se encontró ninguna reservación que coincida con el folio y correo proporcionados.");
    }

    return {
      success: true,
      data: reservacion,
    };
  }

  /**
   * Cancela una reservación existente por ID
   */
  async cancel(id: string) {
    const reservacion = await this.reservationRepository.findById(id);
    if (!reservacion) {
      throw new Error("La reservación no existe.");
    }

    if (reservacion.estado === "cancelada") {
      throw new Error("La reservación ya se encuentra cancelada.");
    }

    if (reservacion.estado === "finalizada" || reservacion.estado === "activa") {
      throw new Error(`No se puede cancelar una reservación con estado: ${reservacion.estado}.`);
    }

    const cancelada = await this.reservationRepository.updateStatus(id, "cancelada");

    return {
      success: true,
      message: "Reservación cancelada correctamente.",
      data: cancelada,
    };
  }

  async confirm(id: string) {
    const reservacion = await this.reservationRepository.findById(id);
    if (!reservacion) {
      throw new Error("La reservación no existe.");
    }

    if (reservacion.estado === "cancelada") {
      throw new Error("La reservación ya se encuentra cancelada.");
    }

    if (reservacion.estado === "finalizada" || reservacion.estado === "activa") {
      throw new Error(`No se puede confirmar una reservación con estado: ${reservacion.estado}.`);
    }

    const confirmada = await this.reservationRepository.updateStatus(id, "confirmada");

    return {
      success: true,
      message: "Reservación confirmada correctamente.",
      data: confirmada,
    };
  }

  /**
   * Realiza el Check-Out de una reservación y pasa la habitación a estado 'limpieza'
   */
  async checkout(id: string) {
    const reservacion = await this.reservationRepository.findById(id);
    if (!reservacion) {
      throw new Error("La reservación no existe.");
    }

    const finalizada = await this.reservationRepository.updateStatus(id, "finalizada");

    return {
      success: true,
      message: "Check-out realizado correctamente. La habitación fue cambiada a estatus 'En Limpieza'.",
      data: finalizada,
      habitacion_id: reservacion.habitacion_id,
    };
  }

  /**
   * Permite cancelar una reservación de invitado validando su folio y correo
   */
  async cancelByGuest(folio: string, email: string) {
    const reservacion = await this.reservationRepository.findByEmailAndFolio(folio, email);
    if (!reservacion) {
      throw new Error("No se encontró la reservación o los datos no coinciden.");
    }

    if (reservacion.estado === "cancelada") {
      throw new Error("La reservación ya se encuentra cancelada.");
    }

    if (reservacion.estado === "finalizada" || reservacion.estado === "activa") {
      throw new Error(`No se puede cancelar una reservación que ya está activa o finalizada.`);
    }

    const cancelada = await this.reservationRepository.updateStatus(reservacion.id, "cancelada");

    return {
      success: true,
      message: "Reservación cancelada correctamente.",
      data: cancelada,
    };
  }

  /**
   * Obtiene todas las reservaciones registradas (actualizando primero estatus de limpieza)
   */
  async getAll() {
    await this.autoUpdateCleaningStatuses();
    const reservaciones = await this.reservationRepository.findAll();
    return {
      success: true,
      data: reservaciones,
    };
  }

  /**
   * Elimina una reservación por ID
   */
  async delete(id: string) {
    const reservacion = await this.reservationRepository.findById(id);
    if (!reservacion) {
      throw new Error("La reservación no existe.");
    }

    await this.reservationRepository.delete(id);

    return {
      success: true,
      message: "Reservación eliminada correctamente.",
    };
  }
}

