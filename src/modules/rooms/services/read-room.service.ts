import { RoomRepository } from "../repositories/room.repository.js";
import { prisma } from "../../../config/database.js";

export class ReadRoomService {
  constructor(
    private roomRepository = new RoomRepository()
  ) {}

  /**
   * Obtiene todas las habitaciones que cumplen con los filtros.
   * @param queryParams Filtros para la consulta (nombre, tipo, precio, checkIn, checkOut)
   */
  async execute(queryParams: any = {}) {
    const { nombre, tipo, precio, checkIn, checkOut } = queryParams;
    const filter: Record<string, unknown> = {};

    if (nombre) filter["nombre"] = { contains: String(nombre), mode: 'insensitive' };
    if (tipo) filter["tipo_habitacion"] = { equals: String(tipo) };
    if (precio) filter["precio_base_noche"] = { equals: Number(precio) };

    if (checkIn && checkOut) {
      const fechaEntrada = new Date(String(checkIn));
      const fechaSalida = new Date(String(checkOut));
      fechaEntrada.setHours(0, 0, 0, 0);
      fechaSalida.setHours(0, 0, 0, 0);

      if (!isNaN(fechaEntrada.getTime()) && !isNaN(fechaSalida.getTime()) && fechaEntrada < fechaSalida) {
        const conflictingReservations = await (prisma as any).reservacion.findMany({
          where: {
            estado: { not: "cancelada" },
            deleted_at: null,
            AND: [
              { fecha_entrada: { lt: fechaSalida } },
              { fecha_salida: { gt: fechaEntrada } },
            ],
          },
          select: { habitacion_id: true },
        });

        const occupiedRoomIds = conflictingReservations.map((r: any) => r.habitacion_id);
        if (occupiedRoomIds.length > 0) {
          filter["id"] = { notIn: occupiedRoomIds };
        }
      }
    }

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