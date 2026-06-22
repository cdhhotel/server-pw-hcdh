import { Router } from "express";
import authRoutes from "./auth.routes.js";
import hotelRoutes from "./hotel.routes.js";
import roomRoutes from "./room.routes.js";
import reservationRoutes from "./reservation.routes.js";

const router = Router();

router.get("/health", (_, res) => {

    return res.status(200).json({

        success: true,

        message: "API funcionando"

    });

});

router.use(authRoutes);
router.use(hotelRoutes);
router.use(roomRoutes);
router.use(reservationRoutes);

export default router;