import { ItineraryRepository } from "../repositories/itinerary.repository.js";

export class ReadItineraryService {
  constructor(private itineraryRepository = new ItineraryRepository()) {}

  /** Lista todas las actividades del itinerario con filtros opcionales */
  async execute(filter: any = {}) {
    const items = await this.itineraryRepository.findAll(filter);
    return { success: true, data: items };
  }

  /** Obtiene una actividad por ID */
  async findOne(id: string) {
    const item = await this.itineraryRepository.findById(id);
    return { success: !!item, data: item };
  }
}
