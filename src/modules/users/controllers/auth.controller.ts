import { Router } from "express";

import { CreateUserService } from "../services/create-user.service.js";
import { AuthService } from "../services/auth.service.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const service = new CreateUserService();
    const user = await service.execute(req.body);

    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, rol, hotel } = req.body;
    const service = new AuthService();
    const result = await service.login({ email, password, rol, hotel });

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(401).json({ success: false, message: err.message });
  }
});

export default router;
