import { Router } from "express";

import { CreateUserService } from "../services/create-user.service.js";
import { ReadUserService } from "../services/read-user.service.js";
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


router.get('/all', async (req, res) => {
  try {
    const service = new ReadUserService();
    const users = await service.execute();
    // service.execute() ya retorna el arreglo directamente del repositorio
    return res.json({ success: true, data: users });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
})

router.get('/:id', async (req, res) => {
  try {
    const service = new ReadUserService();
    const user = await service.findOne(req.params.id);
    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
})



export default router;
