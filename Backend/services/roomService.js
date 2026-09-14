import { AppError } from "../middleware/errorHandler.js"
import { createAccessToken } from "../utils/token.js"
import { GUEST_ROOM_ID, GUEST_ROOM_NAME, normalizeRoomId, normalizeUsername, ROOM_ID_PATTERN, sanitizeRoom } from "../utils/room.js"

const rooms = new Map()
const createSession = (room, username) => { const accessToken = createAccessToken(); room.sessions.set(accessToken, { username }); return accessToken }

export function createGuestRoom(payload) {
  const username = normalizeUsername(payload?.username)
  const room = rooms.get(GUEST_ROOM_ID) || { roomId: GUEST_ROOM_ID, roomName: GUEST_ROOM_NAME, password: null, createdBy: "system", isGuest: true, sessions: new Map() }
  rooms.set(GUEST_ROOM_ID, room)
  return { room: sanitizeRoom(room), accessToken: createSession(room, username) }
}

export function createPrivateRoom(payload) {
  const username = normalizeUsername(payload?.username)
  const roomId = normalizeRoomId(payload?.roomId)
  const roomName = typeof payload?.roomName === "string" ? payload.roomName.trim() : ""
  const password = typeof payload?.password === "string" ? payload.password.trim() : ""
  if (!payload?.username?.trim() || !roomId || !roomName || !password) throw new AppError(400, "Username, room name, room ID, and password are required.")
  if (!ROOM_ID_PATTERN.test(roomId)) throw new AppError(400, "Room ID must be 4 to 20 characters using letters, numbers, hyphen, or underscore.")
  if (roomId === GUEST_ROOM_ID) throw new AppError(409, "This room ID is reserved.")
  if (rooms.has(roomId)) throw new AppError(409, "This room ID is already in use.")
  const room = { roomId, roomName, password, createdBy: username, isGuest: false, sessions: new Map() }
  rooms.set(roomId, room)
  return { room: sanitizeRoom(room), accessToken: createSession(room, username) }
}

export function joinPrivateRoom(payload) {
  const username = normalizeUsername(payload?.username)
  const roomId = normalizeRoomId(payload?.roomId)
  const password = typeof payload?.password === "string" ? payload.password.trim() : ""
  if (!roomId || !password) throw new AppError(400, "Room ID and password are required.")
  const room = rooms.get(roomId)
  if (!room) throw new AppError(404, "Room not found.")
  if (room.password !== password) throw new AppError(401, "Invalid room password.")
  return { room: sanitizeRoom(room), accessToken: createSession(room, username) }
}

export function getRoomSession(roomId, accessToken) {
  const room = rooms.get(normalizeRoomId(roomId))
  const member = room?.sessions.get(accessToken)
  return room && member ? { room, member } : null
}
