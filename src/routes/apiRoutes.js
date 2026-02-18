import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { getDistricts, getRanking, getSeason, getUser } from "../controllers/publicController.js";

export const apiRoutes = Router();

apiRoutes.get("/ranking", getRanking);
apiRoutes.get("/distritos", getDistricts);
apiRoutes.get("/temporada", getSeason);
apiRoutes.get("/user/:id", getUser);

apiRoutes.get("/me", authMiddleware, (req, res) => {
    res.json({ user: req.user });
});
