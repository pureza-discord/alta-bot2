import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
    logger.error("api_error", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
}
