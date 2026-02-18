import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiRoutes } from "./routes/apiRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api", apiRoutes);
app.use(errorHandler);

const port = process.env.API_PORT || 4000;
app.listen(port, () => {
    console.log(`API running on ${port}`);
});
