import express from "express"
import { env } from "./config/env.js"
import { createCorsMiddleware } from "./middleware/cors.js"
import { errorHandler } from "./middleware/errorHandler.js"
import roomRoutes from "./routes/roomRoutes.js"

export function createApp() {
  const app = express()
  app.use(createCorsMiddleware(env.allowedOrigins))
  app.use(express.json({ limit: "100kb" }))
  app.get("/", (req, res) => res.status(200).json({ success: true, message: "Code Collab backend is running" }))
  app.get("/health", (req, res) => res.status(200).json({ success: true, message: "ok" }))
  app.use("/api/rooms", roomRoutes)
  app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }))
  app.use(errorHandler)
  return app
}
