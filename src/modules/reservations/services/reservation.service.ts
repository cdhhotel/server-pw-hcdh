import { ReservationRepository } from "../repositories/reservation.repository.js";

export class ReservationService {
  constructor(private reservationRepository = new ReservationRepository()) {}

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
}
