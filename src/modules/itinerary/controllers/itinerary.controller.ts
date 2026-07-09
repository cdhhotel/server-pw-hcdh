import { Router, type Request, type Response } from "express";
import multer from "multer";
import { CreateItineraryService } from "../services/create-itinerary.service.js";
import { ReadItineraryService } from "../services/read-itinerary.service.js";
import { UpdateItineraryService } from "../services/update-itinerary.service.js";
import { DeleteItineraryService } from "../services/delete-itinerary.service.js";
import { uploadItineraryImages } from "../../../middlewares/upload.middleware.js";

const router = Router();

/** Extrae un mensaje legible de cualquier error */
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Ejecuta multer de forma segura dentro del handler */
function runUpload(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    uploadItineraryImages.single("imagen")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        reject(new Error(`Error de carga: ${err.message}`));
      } else if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// ─── GET /itinerary ────────────────────────────────────────────────────────
router.get("/itinerary", async (req, res) => {
  try {
    const service = new ReadItineraryService();
    const filter: any = {};
    if (req.query.usuario_id) filter.usuario_id = String(req.query.usuario_id);
    if (req.query.reservacion_id) filter.reservacion_id = String(req.query.reservacion_id);
    if (req.query.sitio_cercano_id) filter.sitio_cercano_id = String(req.query.sitio_cercano_id);

    const result = await service.execute(filter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: extractMessage(err) });
  }
});

// ─── GET /itinerary/:id ────────────────────────────────────────────────────
router.get("/itinerary/:id", async (req, res) => {
  try {
    const service = new ReadItineraryService();
    const result = await service.findOne(req.params.id);
    if (!result.success) {
      res.status(404).json({ success: false, message: "Actividad no encontrada" });
      return;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: extractMessage(err) });
  }
});

// ─── POST /itinerary-register ──────────────────────────────────────────────
router.post("/itinerary-register", async (req, res) => {
  try {
    await runUpload(req, res);
    const service = new CreateItineraryService();
    const file = req.file as Express.Multer.File | undefined;
    const uploadedUrl = file ? `/uploads/itinerary/${file.filename}` : null;
    const result = await service.execute(req.body, uploadedUrl);
    res.status(201).json(result);
  } catch (err) {
    const message = extractMessage(err);
    console.error("[itinerary-register]", message, req.body);
    res.status(400).json({ success: false, message });
  }
});

// ─── PUT /itinerary/:id ────────────────────────────────────────────────────
router.put("/itinerary/:id", async (req, res) => {
  try {
    await runUpload(req, res);
    const service = new UpdateItineraryService();
    const file = req.file as Express.Multer.File | undefined;
    const newUploadedUrl = file ? `/uploads/itinerary/${file.filename}` : null;
    const result = await service.execute(req.params.id, req.body, newUploadedUrl);
    res.json(result);
  } catch (err) {
    const message = extractMessage(err);
    const status = message.includes("no encontrada") ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
});

// ─── DELETE /itinerary/:id ─────────────────────────────────────────────────
router.delete("/itinerary/:id", async (req, res) => {
  try {
    const service = new DeleteItineraryService();
    const result = await service.execute(req.params.id);
    res.json(result);
  } catch (err) {
    const message = extractMessage(err);
    const status = message.includes("no encontrada") ? 404 : 400;
    res.status(status).json({ success: false, message });
  }
});

export default router;
