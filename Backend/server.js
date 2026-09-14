import crypto from "node:crypto"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { YSocketIO } from "y-socket.io/dist/server"

const app = express()
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.sendStatus(204)
  }

  next()
})
app.use(express.json())

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

const rooms = new Map()
const activeRoomUsers = new Map()
const GUEST_ROOM_ID = "GUEST"
const GUEST_ROOM_NAME = "Guest Room"

function normalizeRoomId(value) {
  return value?.trim().toUpperCase()
}

function createAccessToken() {
  return crypto.randomBytes(24).toString("hex")
}

function sanitizeRoom(room) {
  return {
    roomId: room.roomId,
    roomName: room.roomName,
    createdBy: room.createdBy,
    isGuest: Boolean(room.isGuest),
  }
}

function normalizeUsername(value) {
  const nextValue = value?.trim()
  if (nextValue) {
    return nextValue
  }

  return `guest-${crypto.randomBytes(3).toString("hex")}`
}

function getValidRoomSession(handshake) {
  const roomId = normalizeRoomId(handshake.auth?.roomId)
  const accessToken = handshake.auth?.roomAccessToken

  if (!roomId || !accessToken) {
    return null
  }

  const room = rooms.get(roomId)
  if (!room) {
    return null
  }

  const member = room.sessions.get(accessToken)
  if (!member) {
    return null
  }

  return { room, member }
}

function getActiveUsers(roomId) {
  const roomUsers = activeRoomUsers.get(roomId)
  if (!roomUsers) {
    return []
  }

  const seen = new Set()
  const users = []

  for (const username of roomUsers.values()) {
    const normalizedUsername = username?.trim()
    if (!normalizedUsername || seen.has(normalizedUsername)) {
      continue
    }

    seen.add(normalizedUsername)
    users.push({ username: normalizedUsername })
  }

  return users
}

function broadcastActiveUsers(namespace, roomId) {
  namespace.emit("presence:update", getActiveUsers(roomId))
}

function ensureGuestRoom() {
  if (rooms.has(GUEST_ROOM_ID)) {
    return rooms.get(GUEST_ROOM_ID)
  }

  const room = {
    roomId: GUEST_ROOM_ID,
    roomName: GUEST_ROOM_NAME,
    password: null,
    createdBy: "system",
    isGuest: true,
    sessions: new Map(),
  }

  rooms.set(GUEST_ROOM_ID, room)
  return room
}

const ySocketIO = new YSocketIO(io, {
  authenticate: (handshake) => {
    return Boolean(getValidRoomSession(handshake))
  },
})

ySocketIO.initialize()
io.of(/^\/yjs\|.*$/).on("connection", (socket) => {
  const session = getValidRoomSession(socket.handshake)
  if (!session) {
    socket.disconnect(true)
    return
  }

  const roomId = session.room.roomId
  const username = session.member.username
  const roomUsers = activeRoomUsers.get(roomId) ?? new Map()

  roomUsers.set(socket.id, username)
  activeRoomUsers.set(roomId, roomUsers)
  broadcastActiveUsers(socket.nsp, roomId)

  socket.on("disconnect", () => {
    const connectedUsers = activeRoomUsers.get(roomId)
    if (!connectedUsers) {
      return
    }

    connectedUsers.delete(socket.id)

    if (connectedUsers.size === 0) {
      activeRoomUsers.delete(roomId)
    }

    broadcastActiveUsers(socket.nsp, roomId)
  })
})

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Code Collab backend is running",
  })
})

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "ok",
    success: true,
  })
})

function sendMethodNotAllowed(res, allowedMethods) {
  return res.status(405).json({
    success: false,
    message: `Use ${allowedMethods.join(", ")} for this endpoint.`,
  })
}

app.get("/api/rooms/guest", (req, res) => {
  return sendMethodNotAllowed(res, ["POST"])
})

app.post("/api/rooms/guest", (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const room = ensureGuestRoom()
  const accessToken = createAccessToken()

  room.sessions.set(accessToken, { username })

  return res.status(200).json({
    success: true,
    message: "Joined guest room successfully.",
    room: sanitizeRoom(room),
    accessToken,
  })
})

app.post("/api/rooms/create", (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const roomId = normalizeRoomId(req.body?.roomId)
  const roomName = req.body?.roomName?.trim()
  const password = req.body?.password?.trim()

  if (!req.body?.username?.trim() || !roomId || !roomName || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, room name, room ID, and password are required.",
    })
  }

  if (!/^[A-Z0-9_-]{4,20}$/.test(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Room ID must be 4 to 20 characters using letters, numbers, hyphen, or underscore.",
    })
  }

  if (roomId === GUEST_ROOM_ID) {
    return res.status(409).json({
      success: false,
      message: "This room ID is reserved.",
    })
  }

  if (rooms.has(roomId)) {
    return res.status(409).json({
      success: false,
      message: "This room ID is already in use.",
    })
  }

  const accessToken = createAccessToken()

  const room = {
    roomId,
    roomName,
    password,
    createdBy: username,
    isGuest: false,
    sessions: new Map([
      [accessToken, { username }],
    ]),
  }

  rooms.set(roomId, room)

  return res.status(201).json({
    success: true,
    message: "Room created successfully.",
    room: sanitizeRoom(room),
    accessToken,
  })
})

app.get("/api/rooms/create", (req, res) => {
  return sendMethodNotAllowed(res, ["POST"])
})

app.post("/api/rooms/join", (req, res) => {
  const username = normalizeUsername(req.body?.username)
  const roomId = normalizeRoomId(req.body?.roomId)
  const password = req.body?.password?.trim()

  if (!roomId || !password) {
    return res.status(400).json({
      success: false,
      message: "Room ID and password are required.",
    })
  }

  const room = rooms.get(roomId)

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found.",
    })
  }

  if (room.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Invalid room password.",
    })
  }

  const accessToken = createAccessToken()
  room.sessions.set(accessToken, { username })

  return res.status(200).json({
    success: true,
    message: "Joined room successfully.",
    room: sanitizeRoom(room),
    accessToken,
  })
})

app.get("/api/rooms/join", (req, res) => {
  return sendMethodNotAllowed(res, ["POST"])
})

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`)
})
