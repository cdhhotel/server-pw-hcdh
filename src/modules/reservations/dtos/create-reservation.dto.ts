export interface CreateReservationDTO {
  habitacion_id: string;
  usuario_id?: string | null | undefined;
  fecha_entrada: string;
  fecha_salida: string;
  cantidad_huespedes: number;
  comentarios?: string | null | undefined;
  huesped_principal: {
    nombre: string;
    apellidos: string;
    email?: string | null | undefined;
    telefono: string;
    fecha_nacimiento?: string | null | undefined;
    nacionalidad?: string | null | undefined;
    tipo_documento?: string | null | undefined;
    numero_documento?: string | null | undefined;
    direccion?: string | null | undefined;
    ciudad?: string | null | undefined;
    pais?: string | null | undefined;
  };
}

export const _dummy = true;

