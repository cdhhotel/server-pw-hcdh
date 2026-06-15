import { Router, type Request, type Response } from "express";
import { z } from "zod";
import multer from "multer";
import { CreateRoomService } from "../services/create-room.service.js";
import { ReadRoomService } from "../services/read-room.service.js";
import { UpdateRoomService } from "../services/update-room.service.js";
import { DeleteRoomService } from "../services/delete-room.service.js";
import { uploadRoomImages } from "../../../middlewares/upload.middleware.js";

const router = Router();

/** Extrae un mensaje legible de cualquier error (ZodError v4 o Error genérico) */
function extractMessage(err: unknown): string {
    if (err instanceof z.ZodError) {
        return err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    }
    if (err instanceof Error) return err.message;
    return String(err);
}

/**
 * Ejecuta el middleware de multer de forma segura dentro del handler.
 * En Express v5, los errores de middlewares sincrónicos van al error handler global;
 * al envolverlo en una Promise lo capturamos nosotros con un 400 claro.
 */
function runUpload(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
        uploadRoomImages.array("imagenes", 10)(req, res, (err) => {
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

// POST /room-register — registrar nueva habitación con imágenes opcionales
router.post("/room-register", async (req, res) => {
    try {
        await runUpload(req, res);

        const service = new CreateRoomService();
        const files = (req.files as Express.Multer.File[]) || [];
        const uploadedUrls = files.map((file) => `/uploads/rooms/${file.filename}`);
        const room = await service.execute(req.body, uploadedUrls);

        res.status(201).json(room);
    } catch (err) {
        const message = extractMessage(err);
        console.error('[room-register]', message, req.body);
        res.status(400).json({ success: false, message });
    }
});

// GET /rooms — listar habitaciones con filtros opcionales
router.get("/rooms", async (req, res) => {
    try {
        const service = new ReadRoomService();
        const { nombre, tipo, precio } = req.query;
        const filter: Record<string, unknown> = {};

        if (nombre) filter["nombre"] = { contains: String(nombre), mode: 'insensitive' };
        if (tipo) filter["tipo_habitacion"] = { equals: String(tipo) };
        if (precio) filter["precio_base_noche"] = { equals: Number(precio) };

        const result = await service.execute(filter);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: extractMessage(err) });
    }
});

// GET /rooms/:id — obtener una habitación por ID
router.get("/rooms/:id", async (req, res) => {
    try {
        const service = new ReadRoomService();
        const result = await service.findOne(req.params.id);
        if (!result.success) {
            res.status(404).json({ success: false, message: 'Habitación no encontrada' });
            return;
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: extractMessage(err) });
    }
});

// PUT /rooms/:id — actualizar habitación con imágenes opcionales
router.put("/rooms/:id", async (req, res) => {
    try {
        await runUpload(req, res);

        const service = new UpdateRoomService();
        const files = (req.files as Express.Multer.File[]) || [];
        const newUploadedUrls = files.map((file) => `/uploads/rooms/${file.filename}`);
        const result = await service.execute(req.params.id, req.body, newUploadedUrls);
        res.json(result);
    } catch (err) {
        const message = extractMessage(err);
        const status = message === 'Habitación no encontrada' ? 404 : 400;
        res.status(status).json({ success: false, message });
    }
});

// DELETE /rooms/:id — eliminar habitación (borrado lógico)
router.delete("/rooms/:id", async (req, res) => {
    try {
        const service = new DeleteRoomService();
        const result = await service.execute(req.params.id);
        if (!result.success) {
            res.status(404).json({ success: false, message: 'Habitación no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Habitación eliminada correctamente' });
    } catch (err) {
        const message = extractMessage(err);
        const status = message === 'Habitación no encontrada' ? 404 : 400;
        res.status(status).json({ success: false, message });
    }
});

export default router;