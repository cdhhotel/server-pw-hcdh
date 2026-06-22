import { z } from "zod";

export const createReservationSchema = z.object({
  habitacion_id: z.string().uuid("El ID de la habitación debe ser un UUID válido"),
  usuario_id: z.string().uuid("El ID de usuario debe ser un UUID válido").optional().nullable(),
  fecha_entrada: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La fecha de entrada debe ser una fecha válida (YYYY-MM-DD)",
  }),
  fecha_salida: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La fecha de salida debe ser una fecha válida (YYYY-MM-DD)",
  }),
  cantidad_huespedes: z.coerce.number().int().positive("La cantidad de huéspedes debe ser mayor a 0"),
  comentarios: z.string().optional().nullable(),
  huesped_principal: z.object({
    nombre: z.string().min(1, "El nombre del huésped es requerido").max(80, "El nombre no debe exceder los 80 caracteres"),
    apellidos: z.string().min(1, "Los apellidos del huésped son requeridos").max(120, "Los apellidos no deben exceder los 120 caracteres"),
    email: z.string().email("El formato del correo electrónico es inválido").max(100).optional().nullable().or(z.literal("")),
    telefono: z.string().min(1, "El teléfono de contacto es requerido").max(20, "El teléfono no debe exceder los 20 caracteres"),
    fecha_nacimiento: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "La fecha de nacimiento es inválida",
    }).optional().nullable(),
    nacionalidad: z.string().max(60).optional().nullable(),
    tipo_documento: z.string().max(20).optional().nullable(),
    numero_documento: z.string().max(30).optional().nullable(),
    direccion: z.string().optional().nullable(),
    ciudad: z.string().max(60).optional().nullable(),
    pais: z.string().max(60).optional().nullable(),
  }),
});

export const updateReservationSchema = createReservationSchema.partial();
