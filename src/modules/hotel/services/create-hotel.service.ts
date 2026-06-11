import argon2 from "argon2";

import { HotelRepository } from "../repositories/hotel.repository.js";

export class CreateHotelService {

  constructor(
    private hotelRepository =
      new HotelRepository()
  ) {}

  async execute(data: any) {

    const hotelExists =
      await this.hotelRepository
        .findByNombre(data.nombre);

    if (hotelExists) {

      throw new Error(
        "El nombre del hotel que ingresó ya se encuentra registrado"
      );

    }

    const hotel =
      await this.hotelRepository
        .create({

          nombre:
            data.nombre,

          descripcion_corta:
            data.descripcion_corta,

          descripcion_larga:
            data.descripcion_larga,

          direccion:
            data.direccion,

          latitud:
            data.latitud,

            longitud:
            data.longitud,

            telefono:
            data.telefono,

            email_contacto:
            data.email_contacto,

            politica_cancelacion:
            data.politica_cancelacion
        });

    return hotel;

  }

}