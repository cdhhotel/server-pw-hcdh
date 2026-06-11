import argon2 from "argon2";

import { UserRepository } from "../repositories/user.repository.js";

export class CreateUserService {

  constructor(
    private userRepository =
      new UserRepository()
  ) {}

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
            data.hotelId,

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

    return user;

  }

}