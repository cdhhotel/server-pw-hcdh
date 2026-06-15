import { prisma } from "../../../config/database.js";

export class RoomRepository {
  async findById(id: string) {
    return (prisma as any).habitacion.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });
  }

  async findByHotelAndNumero(hotelId: string, numero: string) {
    return (prisma as any).habitacion.findFirst({
      where: {
        hotel_id: hotelId,
        numero,
        deleted_at: null,
      },
    });
  }

  async findAll(filter: any = {}) {
    return (prisma as any).habitacion.findMany({
      where: {
        ...filter,
        deleted_at: null,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  async create(data: any) {
    return (prisma as any).habitacion.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return (prisma as any).habitacion.update({
      where: { id },
      data,
    });
  }

  async deleteSoft(id: string) {
    return (prisma as any).habitacion.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }
}
