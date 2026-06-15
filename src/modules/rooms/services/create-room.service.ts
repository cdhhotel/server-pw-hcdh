import { RoomRepository } from "../repositories/room.repository.js";
import { HotelRepository } from "../../hotel/repositories/hotel.repository.js";
import { createRoomSchema } from "../validators/room.schema.js";

export class CreateRoomService {
  constructor(
    private roomRepository = new RoomRepository(),
    private hotelRepository = new HotelRepository()
  ) { }

  async execute(data: any, uploadedFiles: string[] = []) {
    const normalizedData = {
      ...data,
      hotel_id: data.hotel_id || data.hotelId,
      tipo_habitacion: data.tipo_habitacion || data.tipoHabitacion,
      precio_base_noche: data.precio_base_noche || data.precioBaseNoche,
      capacidad_maxima: data.capacidad_maxima || data.capacidadMaxima,
      numero_camas: data.numero_camas || data.numeroCamas,
      tipo_camas: data.tipo_camas || data.tipoCamas,
      metros_cuadrados: data.metros_cuadrados || data.metrosCuadrados,
      atributos_extra: data.atributos_extra || data.atributosExtra,
      descripcion_corta: data.descripcion_corta || data.descripcionCorta,
      descripcion_larga: data.descripcion_larga || data.descripcionLarga,
    };

    const validatedData = createRoomSchema.parse(normalizedData);

    const hotelExists = await this.hotelRepository.findById(validatedData.hotel_id);
    if (!hotelExists) {
      throw new Error("El hotel especificado no existe");
    }
    const roomExists = await this.roomRepository.findByHotelAndNumero(
      validatedData.hotel_id,
      validatedData.numero
    );
    if (roomExists) {
      throw new Error("El número de habitación ya se encuentra registrado para este hotel");
    }

    // 4. Procesar atributos_extra para inyectar imágenes
    let parsedAtributosExtra: any = {};
    if (validatedData.atributos_extra) {
      if (typeof validatedData.atributos_extra === "string") {
        try {
          parsedAtributosExtra = JSON.parse(validatedData.atributos_extra);
        } catch (e) {
          parsedAtributosExtra = {};
        }
      } else if (typeof validatedData.atributos_extra === "object") {
        parsedAtributosExtra = validatedData.atributos_extra;
      }
    }

    // Guardar las rutas de las imágenes subidas en atributos_extra.imagenes
    parsedAtributosExtra.imagenes = uploadedFiles;

    // 5. Crear habitación
    const room = await this.roomRepository.create({
      hotel_id: validatedData.hotel_id,
      numero: validatedData.numero,
      nombre: validatedData.nombre,
      tipo_habitacion: validatedData.tipo_habitacion,
      descripcion_corta: validatedData.descripcion_corta,
      descripcion_larga: validatedData.descripcion_larga,
      precio_base_noche: validatedData.precio_base_noche,
      capacidad_maxima: validatedData.capacidad_maxima,
      numero_camas: validatedData.numero_camas,
      tipo_camas: validatedData.tipo_camas,
      metros_cuadrados: validatedData.metros_cuadrados,
      estatus: validatedData.estatus,
      atributos_extra: parsedAtributosExtra,
    });

    return room;
  }
}