import argon2 from "argon2";

import { HotelRepository } from "../repositories/hotel.repository.js";
import { env } from "../../../config/env.js";

export class HotelService {

  constructor(
    private hotelRepository = new HotelRepository()
  ) {}

  async registrarHotel(data: { nombre: string; descripcion_corta: string, descripcion_larga: string, direccion: string, latitud: string, longitud: string, telefono: string, email_contacto: string, politica_cancelacion: string }) {

    const hotel = await this.hotelRepository.findByNombre(data.nombre);

    return {
      hotel: {
        nombre: hotel.nombre,
        descripcion_corta: hotel.descripcion_corta,
        descripcion_larga: hotel.descripcion_larga,
        direccion: hotel.direccion,
        latitud: hotel.latitud,
        longitud: hotel.longitud,
        telefono: hotel.telefono,
        email_contacto: hotel.email_contacto,
        politica_cancelacion: hotel.politica_cancelacion
      },
    };

  }

}
