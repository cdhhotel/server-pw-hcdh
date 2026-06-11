import { Router } from "express";
import authController from "../modules/users/controllers/auth.controller.js";

const router = Router();

router.use("/auth", authController);

export default router;
