import "dotenv/config"

export const env = {
  port: Number(process.env.PORT) || 3000,
  allowedOrigins: new Set((process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((origin) => origin.trim()).filter(Boolean)),
}
