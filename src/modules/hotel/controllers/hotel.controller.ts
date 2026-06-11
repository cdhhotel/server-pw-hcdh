import { Router } from "express";

import { CreateHotelService } from "../services/create-hotel.service.js";
import { ReadHotelService } from "../services/read-hotel.service.js";

const router = Router();

router.post("/hotel-register", async (req, res) => {
  try {
    const service = new CreateHotelService();
    const hotel = await service.execute(req.body);

    return res.status(201).json(hotel);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/hotels", async (req, res) => {
  try {
    const service = new ReadHotelService();
    // soporta filtros simples vía query params (opcional)
    const { nombre } = req.query;
    const filter: any = {};
    if (nombre) {
      filter.nombre = { contains: String(nombre), mode: 'insensitive' };
    }

    const result = await service.execute(filter);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/hotels/:id", async (req, res) => {
  try {
    const service = new ReadHotelService();
    const result = await service.findOne(req.params.id);
    if (!result.success) return res.status(404).json({ success: false, message: 'Hotel no encontrado' });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});



export default router;
