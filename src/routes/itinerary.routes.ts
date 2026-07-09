import { Router } from "express";
import itineraryController from "../modules/itinerary/controllers/itinerary.controller.js";

const router = Router();

// Montar el controlador de itinerario bajo el prefijo /itinerary
router.use("/itinerary", itineraryController);

export default router;
