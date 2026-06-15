import { z } from "zod";

export const createRoomSchema = z.object({
  hotel_id: z.string().uuid("El ID de hotel debe ser un UUID válido"),
  numero: z.string().min(1, "El número de habitación es requerido").max(10, "El número de habitación no debe exceder 10 caracteres"),
  nombre: z.string().max(100, "El nombre no debe exceder 100 caracteres").optional().nullable(),
  tipo_habitacion: z.string().min(1, "El tipo de habitación es requerido"),
  descripcion_corta: z.string().optional().nullable(),
  descripcion_larga: z.string().optional().nullable(),
  precio_base_noche: z.coerce.number().min(0, "El precio base debe ser mayor o igual a 0"),
  capacidad_maxima: z.coerce.number().int().positive("La capacidad máxima debe ser mayor a 0"),
  numero_camas: z.coerce.number().int().nonnegative("El número de camas debe ser mayor o igual a 0").max(4),
  tipo_camas: z.string().max(50, "El tipo de camas no debe exceder 50 caracteres").optional().nullable(),
  metros_cuadrados: z.coerce.number().int().positive("Los metros cuadrados deben ser mayores a 0").optional().nullable(),
  estatus: z.enum(["disponible", "mantenimiento", "ocupada"]).default("disponible"),
  atributos_extra: z.any().optional(),
});

export const updateRoomSchema = createRoomSchema.partial();
