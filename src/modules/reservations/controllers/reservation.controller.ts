import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { CreateReservationService } from "../services/create-reservation.service.js";
import { ReservationService } from "../services/reservation.service.js";
import { createReservationSchema } from "../validators/reservation.schema.js";

const router = Router();

/** Extrae un mensaje legible de cualquier error (ZodError o Error genérico) */
function extractMessage(err: unknown): string {
  if (err instanceof z.ZodError) {
    return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

// GET /reservations — obtener todas las reservaciones (para administración)
router.get("/", async (req: Request, res: Response) => {
  try {
    const service = new ReservationService();
    const result = await service.getAll();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: extractMessage(err) });
  }
});

// POST /reservations — registrar una nueva reservación (público / para clientes e invitados)
router.post("/", async (req: Request, res: Response) => {
  try {
    // Validar el cuerpo de la petición con Zod
    const validatedBody = createReservationSchema.parse(req.body);

    const service = new CreateReservationService();
    const result = await service.execute(validatedBody);

    res.status(201).json(result);
  } catch (err) {
    const message = extractMessage(err);
    console.error("[register-reservation]", message, req.body);
    res.status(400).json({ success: false, message });
  }
});

// GET /reservations/consultar — buscar reservación por folio y correo (público para invitados)
router.get("/consultar", async (req: Request, res: Response) => {
  try {
    const { folio, email } = req.query;

    if (!folio || !email) {
      res.status(400).json({
        success: false,
        message: "El folio y el correo electrónico son requeridos para la consulta.",
      });
      return;
    }

    const service = new ReservationService();
    const result = await service.getByFolioAndEmail(String(folio), String(email));

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: extractMessage(err) });
  }
});

// POST /reservations/:id/cancelar — cancelar reservación por ID (para administradores / usuarios autenticados)
router.post("/:id/cancelar", async (req: Request, res: Response) => {
  try {
    const service = new ReservationService();
    const result = await service.cancel(String(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: extractMessage(err) });
  }
});

router.post("/:id/confirmar", async (req: Request, res: Response) => {
  try {
    const service = new ReservationService();
    const result = await service.confirm(String(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: extractMessage(err) });
  }
});

// POST /reservations/cancelar-invitado — cancelar reservación por folio y correo (para invitados)
router.post("/cancelar-invitado", async (req: Request, res: Response) => {
  try {
    const { folio, email } = req.body;

    if (!folio || !email) {
      res.status(400).json({
        success: false,
        message: "El folio y el correo electrónico son requeridos para la cancelación.",
      });
      return;
    }

    const service = new ReservationService();
    const result = await service.cancelByGuest(String(folio), String(email));
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: extractMessage(err) });
  }
});

export default router;
