import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { UserRepository } from "../repositories/user.repository.js";
import { env } from "../../../config/env.js";

export class AuthService {

  constructor(
    private userRepository = new UserRepository()
  ) {}

  async login(data: { email: string; password: string }) {

    const user = await this.userRepository.findByEmail(data.email);

    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    const valid = await argon2.verify(user.password_hash, data.password);

    if (!valid) {
      throw new Error("Credenciales inválidas");
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        telefono: user.telefono
      },
      token
    };

  }

}
