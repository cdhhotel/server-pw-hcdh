import { prisma } from "../../../config/database.js";

export class ReservationRepository {
    /**
     * Busca reservaciones que se traslapen con las fechas especificadas para una habitación
     */
    async findConflictingReservations(habitacionId: string, fechaEntrada: Date, fechaSalida: Date) {
        return prisma.reservacion.findMany({
            where: {
                habitacion_id: habitacionId,
                estado: {
                    not: "cancelada",
                },
                deleted_at: null,
                AND: [
                    {
                        fecha_entrada: {
                            lt: fechaSalida,
                        },
                    },
                    {
                        fecha_salida: {
                            gt: fechaEntrada,
                        },
                    },
                ],
            },
        });
    }

    /**
     * Busca un huésped por correo electrónico o por número de documento.
     * Si existe, lo actualiza con la información más reciente; si no, lo crea.
     */
    async findOrCreateGuest(data: {
        nombre: string;
        apellidos: string;
        email?: string | null;
        telefono: string;
        fecha_nacimiento?: Date | null;
        nacionalidad?: string | null;
        tipo_documento?: string | null;
        numero_documento?: string | null;
        direccion?: string | null;
        ciudad?: string | null;
        pais?: string | null;
    }) {
        let guest = null;

        // Buscar primero por email si está provisto y no es vacío
        if (data.email) {
            guest = await prisma.huesped.findFirst({
                where: {
                    email: {
                        equals: data.email,
                        mode: "insensitive",
                    },
                },
            });
        }

        // Si no se encontró y hay número de documento, buscar por documento
        if (!guest && data.numero_documento) {
            guest = await prisma.huesped.findUnique({
                where: {
                    numero_documento: data.numero_documento,
                },
            });
        }

        if (guest) {
            // Actualizar el huésped existente
            return prisma.huesped.update({
                where: { id: guest.id },
                data: {
                    nombre: data.nombre,
                    apellidos: data.apellidos,
                    telefono: data.telefono,
                    fecha_nacimiento: data.fecha_nacimiento ?? guest.fecha_nacimiento,
                    nacionalidad: data.nacionalidad ?? guest.nacionalidad,
                    tipo_documento: data.tipo_documento ?? guest.tipo_documento,
                    numero_documento: data.numero_documento ?? guest.numero_documento,
                    direccion: data.direccion ?? guest.direccion,
                    ciudad: data.ciudad ?? guest.ciudad,
                    pais: data.pais ?? guest.pais,
                },
            });
        } else {
            // Crear nuevo huésped
            return prisma.huesped.create({
                data: {
                    nombre: data.nombre,
                    apellidos: data.apellidos,
                    email: data.email || null,
                    telefono: data.telefono,
                    fecha_nacimiento: data.fecha_nacimiento || null,
                    nacionalidad: data.nacionalidad || null,
                    tipo_documento: data.tipo_documento || null,
                    numero_documento: data.numero_documento || null,
                    direccion: data.direccion || null,
                    ciudad: data.ciudad || null,
                    pais: data.pais || null,
                },
            });
        }
    }

    /**
     * Crea una reservación y la asocia al huésped principal de manera transaccional
     */
    async createReservation(
        data: {
            folio: string;
            habitacion_id: string;
            usuario_id?: string | null;
            fecha_entrada: Date;
            fecha_salida: Date;
            cantidad_huespedes: number;
            comentarios?: string | null;
            precio_total_noches: number;
            impuestos?: number | null;
            descuento_aplicado?: number | null;
            total_pagar: number;
            estado?: any;
        },
        huespedId: string
    ) {
        return prisma.$transaction(async (tx) => {
            // 1. Crear la reservación
            const reservacion = await tx.reservacion.create({
                data: {
                    folio: data.folio,
                    habitacion_id: data.habitacion_id,
                    usuario_id: data.usuario_id || null,
                    fecha_entrada: data.fecha_entrada,
                    fecha_salida: data.fecha_salida,
                    cantidad_huespedes: data.cantidad_huespedes,
                    estado: data.estado || "pendiente",
                    comentarios: data.comentarios || null,
                    precio_total_noches: data.precio_total_noches,
                    impuestos: data.impuestos || 0,
                    descuento_aplicado: data.descuento_aplicado || 0,
                    total_pagar: data.total_pagar,
                },
            });

            // 2. Asociar el huésped a la reservación como principal
            await tx.huesped_reservacion.create({
                data: {
                    reservacion_id: reservacion.id,
                    huesped_id: huespedId,
                    es_principal: true,
                },
            });

            return tx.reservacion.findUnique({
                where: { id: reservacion.id },
                include: {
                    habitacion: true,
                    huesped_reservacion: {
                        include: {
                            huesped: true,
                        },
                    },
                },
            });
        });
    }

    /**
     * Busca reservación por ID
     */
    async findById(id: string) {
        return prisma.reservacion.findUnique({
            where: { id },
            include: {
                habitacion: true,
                huesped_reservacion: {
                    include: {
                        huesped: true,
                    },
                },
                pago: true,
            },
        });
    }

    /**
     * Busca reservación por Folio
     */
    async findByFolio(folio: string) {
        return prisma.reservacion.findUnique({
            where: { folio },
            include: {
                habitacion: true,
                huesped_reservacion: {
                    include: {
                        huesped: true,
                    },
                },
                pago: true,
            },
        });
    }

    /**
     * Busca reservación por Folio e Email del huésped principal
     */
    async findByEmailAndFolio(folio: string, email: string) {
        return prisma.reservacion.findFirst({
            where: {
                folio,
                huesped_reservacion: {
                    some: {
                        es_principal: true,
                        huesped: {
                            email: {
                                equals: email,
                                mode: "insensitive",
                            },
                        },
                    },
                },
                deleted_at: null,
            },
            include: {
                habitacion: true,
                huesped_reservacion: {
                    include: {
                        huesped: true,
                    },
                },
                pago: true,
            },
        });
    }

    /**
     * Actualiza el estado de la reservación (confirmada, cancelada, etc.)
     */
    async updateStatus(id: string, estado: any) {
        return prisma.reservacion.update({
            where: { id },
            data: {
                estado,
                updated_at: new Date(),
            },
        });
    }

    /**
     * Obtiene todas las reservaciones
     */
    async findAll() {
        return prisma.reservacion.findMany({
            where: {
                deleted_at: null,
            },
            include: {
                habitacion: true,
                huesped_reservacion: {
                    include: {
                        huesped: true,
                    },
                },
                pago: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }
}
