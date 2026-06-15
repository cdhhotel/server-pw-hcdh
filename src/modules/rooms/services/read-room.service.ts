import { RoomRepository } from "../repositories/room.repository.js";

export class ReadRoomService {
  constructor(
    private roomRepository = new RoomRepository()
  ) {}

  /**
   * Obtiene todas las habitaciones que cumplen con los filtros.
   * @param filter Filtros para la consulta
   */
  async execute(filter: any = {}) {
    const rooms = await this.roomRepository.findAll(filter);
    return {
      success: true,
      data: rooms,
    };
  }

  /**
   * Obtiene una habitación específica por ID.
   * @param id ID de la habitación
   */
  async findOne(id: string) {
    const room = await this.roomRepository.findById(id);
    return {
      success: !!room,
      data: room,
    };
  }
}