import fs from "fs";
import path from "path";
import { ItineraryRepository } from "../repositories/itinerary.repository.js";

export class UpdateItineraryService {
  constructor(private itineraryRepository = new ItineraryRepository()) {}

  async execute(id: string, data: any, newUploadedFile: string | null = null) {
    if (!id) throw new Error("ID de itinerario requerido");

    const existing = await this.itineraryRepository.findById(id);
    if (!existing) throw new Error("Actividad de itinerario no encontrada");

    // Normalizar camelCase → snake_case
    const normalized: any = {
      nombre: data.nombre ?? undefined,
      horario_inicio: (data.horario_inicio ?? data.horarioInicio) ?? undefined,
      horario_fin: (data.horario_fin ?? data.horarioFin) ?? undefined,
      disponibilidad: data.disponibilidad != null ? Number(data.disponibilidad) : undefined,
      seleccionado:
        data.seleccionado != null
          ? data.seleccionado === "true" || data.seleccionado === true
          : undefined,
      usuario_id: (data.usuario_id ?? data.usuarioId) ?? undefined,
      reservacion_id: (data.reservacion_id ?? data.reservacionId) ?? undefined,
      sitio_cercano_id: (data.sitio_cercano_id ?? data.sitioCercanoId) ?? undefined,
      fecha_actualizacion: new Date(),
    };

    // Manejar atributos_extra: fusionar lo existente con lo nuevo
    const oldExtra = (existing.atributos_extra as any) ?? {};
    const newDescripcion = data.descripcion !== undefined ? data.descripcion : oldExtra.descripcion;
    const newCategoria = data.categoria !== undefined ? data.categoria : oldExtra.categoria;

    // Manejar imagen: si se sube nueva, eliminar la anterior físicamente
    let finalImageUrl = oldExtra.imagen_url ?? null;

    if (newUploadedFile !== null) {
      // Eliminar imagen anterior si existe
      if (finalImageUrl) {
        const relativePath = finalImageUrl.startsWith("/") ? finalImageUrl.slice(1) : finalImageUrl;
        const absolutePath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(absolutePath)) {
          try { fs.unlinkSync(absolutePath); } catch (e) { /* ignorar */ }
        }
      }
      finalImageUrl = newUploadedFile;
    }

    // Si se pide eliminar la imagen (remove_image === 'true')
    if (data.remove_image === "true" && finalImageUrl) {
      const relativePath = finalImageUrl.startsWith("/") ? finalImageUrl.slice(1) : finalImageUrl;
      const absolutePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(absolutePath)) {
        try { fs.unlinkSync(absolutePath); } catch (e) { /* ignorar */ }
      }
      finalImageUrl = null;
    }

    const atributos_extra = {
      ...oldExtra,
      descripcion: newDescripcion,
      categoria: newCategoria,
      imagen_url: finalImageUrl,
    };

    // Eliminar campos undefined del objeto de actualización
    const updateData: any = { atributos_extra };
    Object.keys(normalized).forEach((k) => {
      if (normalized[k] !== undefined) updateData[k] = normalized[k];
    });

    const updated = await this.itineraryRepository.update(id, updateData);
    return { success: true, data: updated };
  }
}
