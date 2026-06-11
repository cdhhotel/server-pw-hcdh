import { HotelRepository } from "../repositories/hotel.repository.js";

export class ReadHotelService {

  constructor(
    private hotelRepository = new HotelRepository()
  ) {}

  /**
   * Ejecuta la lectura de hoteles.
   * @param filter Opcional, objeto de filtros para la consulta (e.g. { nombre: { contains: 'Casa' } })
   */
  async execute(filter: any = {}) {
    const hotels = await this.hotelRepository.findAll(filter);

    return {
      success: true,
      data: hotels
    };
  }

  async findOne(id: string) {
    const hotel = await this.hotelRepository.findById(id);
    return {
      success: !!hotel,
      data: hotel
    };
  }

}
