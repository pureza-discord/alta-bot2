import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
    const token =
        req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token || null;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
