import { RoomRepository } from "../repositories/room.repository.js";

export class DeleteRoomService {
  constructor(
    private roomRepository = new RoomRepository()
  ) {}

  /**
   * Elimina lógicamente una habitación marcando su campo deleted_at.
   * @param id ID de la habitación
   */
  async execute(id: string) {
    if (!id) {
      throw new Error("ID de habitación requerido");
    }

    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new Error("Habitación no encontrada");
    }

    await this.roomRepository.deleteSoft(id);

    return {
      success: true,
      message: "Habitación eliminada correctamente",
    };
  }
}