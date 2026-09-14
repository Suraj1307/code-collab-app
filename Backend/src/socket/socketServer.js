import { Server } from "socket.io"
import { YSocketIO } from "y-socket.io/dist/server"
import { createSocketCors } from "../middleware/cors.js"
import { getDocumentRoomId, getValidRoomSession } from "./authentication.js"
import { addUserToRoom, broadcastActiveUsers, removeUserFromRoom } from "./presence.js"

export function initializeSocketServer(httpServer, allowedOrigins) {
  const io = new Server(httpServer, { cors: createSocketCors(allowedOrigins) })
  const ySocketIO = new YSocketIO(io, { authenticate: (handshake) => Boolean(getValidRoomSession(handshake)) })
  ySocketIO.initialize()
  const namespace = ySocketIO.nsp
  namespace.use((socket, next) => {
    const session = getValidRoomSession(socket.handshake)
    if (!session || session.room.roomId !== getDocumentRoomId(socket.nsp.name)) return next(new Error("Unauthorized"))
    socket.data.roomSession = session
    return next()
  })
  namespace.on("connection", (socket) => {
    const { room, member } = socket.data.roomSession
    addUserToRoom(room.roomId, socket.id, member.username)
    broadcastActiveUsers(namespace, room.roomId)
    socket.on("disconnect", () => {
      removeUserFromRoom(room.roomId, socket.id)
      broadcastActiveUsers(namespace, room.roomId)
    })
  })
  return io
}
