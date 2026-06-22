import { prisma } from "../../../config/database.js";

export class UserRepository {

  async findByEmail(email: string) {

    return prisma.usuario.findUnique({
      where: {
        email
      },
      include: {
        rol: true,
        hotel: true
      }
    });

  }

  async create(data: any) {

    return prisma.usuario.create({
      data,
      include: {
        rol: true,
        hotel: true
      }
    });

  }
  async findAll(filter: any = {}) {
    return prisma.usuario.findMany({
      where: filter,
      include: {
        rol: true,
        hotel: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      include: {
        rol: true,
        hotel: true
      }
    });
  }

}