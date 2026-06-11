import { z } from "zod";

export const createUserSchema = z.object({

  hotelId: z.string().uuid().optional(),

  nombre: z
    .string()
    .min(2)
    .max(80),

  apellidos: z
    .string()
    .min(2)
    .max(120),

  email: z
    .email(),

  password: z
    .string()
    .min(8),

  telefono: z
    .string()
    .max(20)
    .optional(),

  rolId: z.uuid()
});