export interface CreateUserDTO {
  hotelId?: string;

  nombre: string;

  apellidos: string;

  email: string;

  password: string;

  telefono?: string;

  rolId: string;
}