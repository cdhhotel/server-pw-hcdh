import { UserRepository } from "../repositories/user.repository.js";

export class ReadUserService {

    constructor(
        private userRepository = new UserRepository()
    ) { }

    /**
     * Ejecuta la lectura de usuarios.
     * @param filter Opcional, objeto de filtros para la consulta (e.g. { nombre: { contains: 'Usuario' } })
     */
    async execute(filter: any = {}) {
        return this.userRepository.findAll(filter);
    }

    async findOne(id: string) {
        return this.userRepository.findById(id);
    }

}
