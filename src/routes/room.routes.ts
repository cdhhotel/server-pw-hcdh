import { Router } from "express";
import roomController from "../modules/rooms/controllers/room.controller.js";

const router = Router();

// Montar el controlador de habitaciones bajo el prefijo /room
router.use("/room", roomController);

export default router;
