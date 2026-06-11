import { prisma } from "../../../config/database.js";

export class HotelRepository {

  async findByNombre(nombre: string) {

    return (prisma as any).hotel.findFirst({
      where: {
        nombre
      }
    });

  }

  async findAll(filter: any = {}) {
    return (prisma as any).hotel.findMany({
      where: filter,
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: string) {
    return (prisma as any).hotel.findUnique({
      where: { id }
    });
  }

  async update(id: string, data: any) {
    return (prisma as any).hotel.update({
      where: { id },
      data
    });
  }

  async create(data: any) {

    return (prisma as any).hotel.create({
      data
    });

  }

}