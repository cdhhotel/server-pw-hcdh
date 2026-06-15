import fs from "fs";
import path from "path";
import { RoomRepository } from "../repositories/room.repository.js";
import { HotelRepository } from "../../hotel/repositories/hotel.repository.js";
import { updateRoomSchema } from "../validators/room.schema.js";

export class UpdateRoomService {
  constructor(
    private roomRepository = new RoomRepository(),
    private hotelRepository = new HotelRepository()
  ) {}

  async execute(id: string, data: any, newUploadedFiles: string[] = []) {
    if (!id) {
      throw new Error("ID de habitación requerido");
    }

    // 1. Obtener la habitación existente
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new Error("Habitación no encontrada");
    }

    // Normalizar claves camelCase a snake_case
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

    // 2. Validar campos con Zod (haciéndolos opcionales para PUT parcial)
    const validatedData = updateRoomSchema.parse(normalizedData);

    // 3. Si se modifica el hotel_id, verificar que exista
    if (validatedData.hotel_id && validatedData.hotel_id !== room.hotel_id) {
      const hotelExists = await this.hotelRepository.findById(validatedData.hotel_id);
      if (!hotelExists) {
        throw new Error("El hotel especificado no existe");
      }
    }

    // 4. Si se cambia el número o el hotel, verificar la unicidad
    const targetHotelId = validatedData.hotel_id || room.hotel_id;
    const targetNumero = validatedData.numero || room.numero;
    if (targetHotelId !== room.hotel_id || targetNumero !== room.numero) {
      const roomExists = await this.roomRepository.findByHotelAndNumero(
        targetHotelId,
        targetNumero
      );
      if (roomExists && roomExists.id !== id) {
        throw new Error("El número de habitación ya se encuentra registrado para este hotel");
      }
    }

    // 5. Manejar imágenes actuales a conservar
    let keepImages: string[] = [];
    if (data.imagenes_actuales !== undefined) {
      if (typeof data.imagenes_actuales === "string") {
        try {
          keepImages = JSON.parse(data.imagenes_actuales);
        } catch (e) {
          keepImages = [];
        }
      } else if (Array.isArray(data.imagenes_actuales)) {
        keepImages = data.imagenes_actuales;
      }
    } else {
      // Si no se especifica, por defecto mantenemos todas las imágenes existentes
      const oldExtra = (room.atributos_extra as any) || {};
      keepImages = oldExtra.imagenes || [];
    }

    // 6. Eliminar físicamente del servidor las imágenes que ya no se conservarán
    const oldExtra = (room.atributos_extra as any) || {};
    const oldImages = oldExtra.imagenes || [];
    const imagesToDelete = oldImages.filter((img: string) => !keepImages.includes(img));

    for (const imgPath of imagesToDelete) {
      // imgPath es del tipo "/uploads/rooms/filename.ext"
      const relativePath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
      const absolutePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (err) {
          console.error(`Error al eliminar el archivo físico ${absolutePath}:`, err);
        }
      }
    }

    // 7. Consolidar el arreglo final de imágenes
    const finalImages = [...keepImages, ...newUploadedFiles];

    // 8. Construir el nuevo atributos_extra fusionando el anterior
    let finalAtributosExtra: any = {};
    if (room.atributos_extra && typeof room.atributos_extra === "object") {
      finalAtributosExtra = { ...room.atributos_extra };
    }

    if (validatedData.atributos_extra) {
      let inputAtributosExtra: any = {};
      if (typeof validatedData.atributos_extra === "string") {
        try {
          inputAtributosExtra = JSON.parse(validatedData.atributos_extra);
        } catch (e) {
          inputAtributosExtra = {};
        }
      } else if (typeof validatedData.atributos_extra === "object") {
        inputAtributosExtra = validatedData.atributos_extra;
      }
      finalAtributosExtra = { ...finalAtributosExtra, ...inputAtributosExtra };
    }

    finalAtributosExtra.imagenes = finalImages;

    // 9. Actualizar los campos permitidos y guardar
    const updated = await this.roomRepository.update(id, {
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
      atributos_extra: finalAtributosExtra,
      updated_at: new Date(),
    });

    return {
      success: true,
      data: updated,
    };
  }
}