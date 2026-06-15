export interface CreateRoomDTO {
  hotel_id: string;
  numero: string;
  nombre?: string;
  tipo_habitacion: string;
  descripcion_corta?: string;
  descripcion_larga?: string;
  precio_base_noche: number;
  capacidad_maxima: number;
  numero_camas: number;
  tipo_camas?: string;
  metros_cuadrados?: number;
  estatus?: string;
  atributos_extra?: any;
}
