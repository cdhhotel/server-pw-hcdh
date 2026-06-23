import { prisma } from "../../../config/database.js";

export class ItineraryRepository {
  /** Busca un itinerario por ID (incluye datos del sitio_cercano) */
  async findById(id: string) {
    return (prisma as any).itinerario.findFirst({
      where: { id },
      include: {
        sitio_cercano: true,
      },
    });
  }

  /** Lista todos los itinerarios con sus sitios cercanos */
  async findAll(filter: any = {}) {
    return (prisma as any).itinerario.findMany({
      where: { ...filter },
      include: {
        sitio_cercano: true,
      },
      orderBy: {
        fecha_creacion: "desc",
      },
    });
  }

  /** Crea un nuevo itinerario */
  async create(data: any) {
    return (prisma as any).itinerario.create({ data });
  }

  /** Actualiza un itinerario */
  async update(id: string, data: any) {
    return (prisma as any).itinerario.update({
      where: { id },
      data,
      include: { sitio_cercano: true },
    });
  }

  /** Elimina un itinerario (borrado físico — el modelo no tiene deleted_at) */
  async delete(id: string) {
    return (prisma as any).itinerario.delete({ where: { id } });
  }
}
