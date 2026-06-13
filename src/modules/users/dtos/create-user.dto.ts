export interface CreateUserDTO {
  hotelId?: string;
  hotel_id?: string;

  nombre: string;

  apellidos: string;

  email: string;

  password: string;

  telefono?: string;

  rolId?: string;
  rol_id?: string;
}