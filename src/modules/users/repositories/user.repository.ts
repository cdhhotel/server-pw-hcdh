import { prisma } from "../../../config/database.js";

export class UserRepository {

  async findByEmail(email: string) {

    return (prisma as any).usuario.findUnique({
      where: {
        email
      }
    });

  }

  async create(data: any) {

    return (prisma as any).usuario.create({
      data
    });

  }

}