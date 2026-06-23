import { ItineraryRepository } from "../repositories/itinerary.repository.js";

export class CreateItineraryService {
  constructor(private itineraryRepository = new ItineraryRepository()) {}

  async execute(data: any, uploadedFile: string | null = null) {
    // Normalizar campos camelCase → snake_case
    const normalized = {
      nombre: data.nombre,
      horario_inicio: data.horario_inicio ?? data.horarioInicio,
      horario_fin: data.horario_fin ?? data.horarioFin,
      disponibilidad: Number(data.disponibilidad ?? 1),
      seleccionado: data.seleccionado === "true" || data.seleccionado === true,
      usuario_id: data.usuario_id ?? data.usuarioId,
      reservacion_id: data.reservacion_id ?? data.reservacionId ?? null,
      sitio_cercano_id: data.sitio_cercano_id ?? data.sitioCercanoId,
      descripcion: data.descripcion ?? null,
      categoria: data.categoria ?? null,
    };

    if (!normalized.nombre) throw new Error("El nombre de la actividad es requerido");
    if (!normalized.horario_inicio) throw new Error("El horario de inicio es requerido");
    if (!normalized.horario_fin) throw new Error("El horario de fin es requerido");
    if (!normalized.usuario_id) throw new Error("El usuario_id es requerido");
    if (!normalized.sitio_cercano_id) throw new Error("El sitio_cercano_id es requerido");

    // Imagen almacenada en atributos_extra.imagen_url
    const atributos_extra: any = {
      descripcion: normalized.descripcion,
      categoria: normalized.categoria,
      imagen_url: uploadedFile ?? null,
    };

    const itinerary = await this.itineraryRepository.create({
      nombre: normalized.nombre,
      horario_inicio: normalized.horario_inicio,
      horario_fin: normalized.horario_fin,
      disponibilidad: normalized.disponibilidad,
      seleccionado: normalized.seleccionado,
      usuario_id: normalized.usuario_id,
      reservacion_id: normalized.reservacion_id,
      sitio_cercano_id: normalized.sitio_cercano_id,
      atributos_extra,
    });

    return { success: true, data: itinerary };
  }
}
