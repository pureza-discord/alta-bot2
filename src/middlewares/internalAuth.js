export function internalAuth(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || token !== process.env.INTERNAL_API_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
}
