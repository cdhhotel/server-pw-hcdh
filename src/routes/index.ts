import { Router } from "express";

const router = Router();

router.get("/health", (_, res) => {

    return res.status(200).json({

        success: true,

        message: "API funcionando"

    });

});

export default router;