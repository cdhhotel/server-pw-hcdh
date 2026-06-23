import { Router } from "express";
import { prisma } from "../../../config/database.js";

import { CreateHotelService } from "../services/create-hotel.service.js";
import { ReadHotelService } from "../services/read-hotel.service.js";
import { UpdateHotelService } from "../services/update-hotel.service.js";

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

router.put("/hotels/:id", async (req, res) => {
  try {
    const service = new UpdateHotelService();
    const result = await service.execute(req.params.id, req.body);
    return res.json(result);
  } catch (err: any) {
    const status = err.message === 'Hotel no encontrado' ? 404 : 400;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// GET /sitios-cercanos — lista todos los sitios cercanos (para selectores en formularios)
router.get("/sitios-cercanos", async (req, res) => {
  try {
    const { categoria, hotel_id } = req.query;
    const where: any = {};
    if (categoria) where.categoria = String(categoria);
    if (hotel_id) where.hotel_id = String(hotel_id);

    const sitios = await (prisma as any).sitio_cercano.findMany({
      where,
      include: {
        evento_local: {
          orderBy: { fecha_inicio: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    });
    return res.json({ success: true, data: sitios });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

