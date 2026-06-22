import { ReservationRepository } from "../repositories/reservation.repository.js";
import { RoomRepository } from "../../rooms/repositories/room.repository.js";
import type { CreateReservationDTO } from "../dtos/create-reservation.dto.js";
import { EmailService } from "./email.service.js";

export class CreateReservationService {
    constructor(
        private reservationRepository = new ReservationRepository(),
        private roomRepository = new RoomRepository()
    ) { }

    async execute(data: CreateReservationDTO) {
        const {
            habitacion_id,
            usuario_id,
            fecha_entrada,
            fecha_salida,
            cantidad_huespedes,
            comentarios,
            huesped_principal,
        } = data;

        // 1. Validar coherencia de fechas
        const fechaEntrada = new Date(fecha_entrada);
        const fechaSalida = new Date(fecha_salida);

        // Normalizar fechas a medianoche local para comparaciones consistentes
        fechaEntrada.setHours(0, 0, 0, 0);
        fechaSalida.setHours(0, 0, 0, 0);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaEntrada < hoy) {
            throw new Error("La fecha de entrada no puede ser menor a la fecha del día de hoy.");
        }

        if (fechaEntrada >= fechaSalida) {
            throw new Error("La fecha de salida debe ser posterior a la fecha de entrada.");
        }

        // 2. Verificar que la habitación exista y esté activa
        const room = await this.roomRepository.findById(habitacion_id);
        if (!room) {
            throw new Error("La habitación solicitada no existe o no está disponible.");
        }

        // 3. Validar capacidad máxima de la habitación
        if (cantidad_huespedes > room.capacidad_maxima) {
            throw new Error(
                `La habitación seleccionada tiene una capacidad máxima de ${room.capacidad_maxima} personas.`
            );
        }

        // 4. Verificar disponibilidad (que no haya reservaciones previas activas en las mismas fechas)
        const conflictingReservations = await this.reservationRepository.findConflictingReservations(
            habitacion_id,
            fechaEntrada,
            fechaSalida
        );

        if (conflictingReservations.length > 0) {
            throw new Error("La habitación no se encuentra disponible en las fechas seleccionadas.");
        }

        // 5. Calcular número de noches y totales
        const diferenciaMs = fechaSalida.getTime() - fechaEntrada.getTime();
        const numeroNoches = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

        const precioBaseNoche = Number(room.precio_base_noche);
        const precioTotalNoches = precioBaseNoche * numeroNoches;

        // Calcular impuestos (16% de IVA estándar)
        const impuestos = precioTotalNoches * 0.16;
        const totalPagar = precioTotalNoches + impuestos;

        // 6. Generar folio único
        const folio = await this.generateUniqueFolio();

        // 7. Buscar o crear el huésped principal
        const huesped = await this.reservationRepository.findOrCreateGuest({
            nombre: huesped_principal.nombre,
            apellidos: huesped_principal.apellidos,
            email: huesped_principal.email ?? null,
            telefono: huesped_principal.telefono,
            fecha_nacimiento: huesped_principal.fecha_nacimiento ? new Date(huesped_principal.fecha_nacimiento) : null,
            nacionalidad: huesped_principal.nacionalidad ?? null,
            tipo_documento: huesped_principal.tipo_documento ?? null,
            numero_documento: huesped_principal.numero_documento ?? null,
            direccion: huesped_principal.direccion ?? null,
            ciudad: huesped_principal.ciudad ?? null,
            pais: huesped_principal.pais ?? null,
        });

        // 8. Crear la reservación
        const reservacion = await this.reservationRepository.createReservation(
            {
                folio,
                habitacion_id,
                usuario_id: usuario_id ?? null,
                fecha_entrada: fechaEntrada,
                fecha_salida: fechaSalida,
                cantidad_huespedes,
                comentarios: comentarios ?? null,
                precio_total_noches: precioTotalNoches,
                impuestos,
                descuento_aplicado: 0,
                total_pagar: totalPagar,
                estado: "pendiente",
            },
            huesped.id
        );

        // 9. Enviar correo de confirmación al huésped (fire-and-forget: no bloquea la respuesta HTTP)
        if (reservacion) {
            const emailService = new EmailService();
            emailService.sendReservationConfirmation(reservacion).catch((err) => {
                console.error(`[EmailService] Error al enviar correo para la reservación ${folio}:`, err);
            });
        }

        return {
            success: true,
            message: "Reservación creada con éxito.",
            data: reservacion,
        };
    }

    /**
     * Genera un folio único y aleatorio de tipo CDH-XXXXXX
     */
    private async generateUniqueFolio(): Promise<string> {
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const prefijo = "CDH";
        let folio = "";
        let esUnico = false;
        let intentos = 0;

        while (!esUnico && intentos < 100) {
            intentos++;
            let sufijo = "";
            for (let i = 0; i < 6; i++) {
                sufijo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
            }
            folio = `${prefijo}-${sufijo}`;

            const existeReservacion = await this.reservationRepository.findByFolio(folio);
            if (!existeReservacion) {
                esUnico = true;
            }
        }

        if (!esUnico) {
            throw new Error("No se pudo generar un folio único para la reservación. Inténtelo de nuevo.");
        }

        return folio;
    }
}
