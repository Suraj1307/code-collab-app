import crypto from "node:crypto"

export const GUEST_ROOM_ID = "GUEST"
export const GUEST_ROOM_NAME = "Guest Room"
export const ROOM_ID_PATTERN = /^[A-Z0-9_-]{4,20}$/
export const normalizeRoomId = (value) => typeof value === "string" ? value.trim().toUpperCase() : ""
export const normalizeUsername = (value) => typeof value === "string" && value.trim() ? value.trim() : `guest-${crypto.randomBytes(3).toString("hex")}`
export const sanitizeRoom = (room) => ({ roomId: room.roomId, roomName: room.roomName, createdBy: room.createdBy, isGuest: Boolean(room.isGuest) })
