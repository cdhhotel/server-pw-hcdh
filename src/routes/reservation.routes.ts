import { Router } from "express";
import reservationController from "../modules/reservations/controllers/reservation.controller.js";

const router = Router();

// Montar el controlador de reservaciones bajo el prefijo /reservations
router.use("/reservations", reservationController);

export default router;
