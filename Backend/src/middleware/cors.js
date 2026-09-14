export function createCorsMiddleware(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.get("origin")
    if (origin && !allowedOrigins.has(origin)) return res.status(403).json({ success: false, message: "Origin is not allowed." })
    if (origin) { res.header("Access-Control-Allow-Origin", origin); res.header("Vary", "Origin") }
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.header("Access-Control-Allow-Headers", "Content-Type")
    return req.method === "OPTIONS" ? res.sendStatus(204) : next()
  }
}

export const createSocketCors = (allowedOrigins) => ({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)), methods: ["GET", "POST"] })
