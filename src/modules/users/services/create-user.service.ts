import argon2 from "argon2";

import { UserRepository } from "../repositories/user.repository.js";

export class CreateUserService {

  constructor(
    private userRepository =
      new UserRepository()
  ) { }

  async execute(data: any) {

    const userExists =
      await this.userRepository
        .findByEmail(data.email);

    if (userExists) {

      throw new Error(
        "El correo que ingresó ya se encuentra registrado"
      );

    }

    const passwordHash =
      await argon2.hash(
        data.password
      );

    const user =
      await this.userRepository
        .create({

          hotel_id:
            data.hotelId || data.hotel_id || "6547a35d-d6d8-4b4a-80f7-aed8c8885811",

          rol_id:
            data.rolId || data.rol_id || "ca19835e-926c-4f26-8d46-50823f8211d9",

          nombre:
            data.nombre,

          apellidos:
            data.apellidos,

          email:
            data.email,

          password_hash:
            passwordHash,

          telefono:
            data.telefono
        });

    console.log(user);
    return user;

  }

}