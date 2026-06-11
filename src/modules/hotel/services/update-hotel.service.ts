import { HotelRepository } from "../repositories/hotel.repository.js";

export class UpdateHotelService {
  constructor(
    private hotelRepository = new HotelRepository()
  ) {}

  /**
   * Actualiza un hotel por id.
   * @param id ID del hotel
   * @param data Campos a actualizar
   */
  async execute(id: string, data: any) {
    if (!id) throw new Error('ID de hotel requerido');

    const exists = await this.hotelRepository.findById(id);
    if (!exists) throw new Error('Hotel no encontrado');

    // Opcional: filtrar campos permitidos
    const allowed = [
      'nombre', 'descripcion_corta', 'descripcion_larga', 'direccion',
      'latitud', 'longitud', 'telefono', 'email_contacto', 'politica_cancelacion', 'estatus'
    ];

    const payload: any = {};
    for (const key of allowed) {
      if (key in data) payload[key] = data[key];
    }

    const updated = await this.hotelRepository.update(id, payload);

    return {
      success: true,
      data: updated
    };
  }
}
