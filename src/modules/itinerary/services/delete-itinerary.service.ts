import fs from "fs";
import path from "path";
import { ItineraryRepository } from "../repositories/itinerary.repository.js";

export class DeleteItineraryService {
  constructor(private itineraryRepository = new ItineraryRepository()) {}

  async execute(id: string) {
    if (!id) throw new Error("ID de itinerario requerido");

    const item = await this.itineraryRepository.findById(id);
    if (!item) throw new Error("Actividad de itinerario no encontrada");

    // Eliminar imagen física si existe
    const extra = (item.atributos_extra as any) ?? {};
    if (extra.imagen_url) {
      const relativePath = extra.imagen_url.startsWith("/")
        ? extra.imagen_url.slice(1)
        : extra.imagen_url;
      const absolutePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(absolutePath)) {
        try { fs.unlinkSync(absolutePath); } catch (e) { /* ignorar */ }
      }
    }

    await this.itineraryRepository.delete(id);

    return { success: true, message: "Actividad eliminada correctamente" };
  }
}
