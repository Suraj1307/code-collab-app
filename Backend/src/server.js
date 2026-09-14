import { createServer } from "node:http"
import { createApp } from "./app.js"
import { env } from "./config/env.js"
import { initializeSocketServer } from "./socket/socketServer.js"

export function startServer() {
  const httpServer = createServer(createApp())
  initializeSocketServer(httpServer, env.allowedOrigins)
  httpServer.listen(env.port, "0.0.0.0", () => console.log(`Server is running on port ${env.port}`))
}
