import { Router } from "express";
import hotelController from "../modules/hotel/controllers/hotel.controller.js";

const router = Router();

router.use("/hotel", hotelController);

export default router;
