import { createGuestRoom, createPrivateRoom, joinPrivateRoom } from "../services/roomService.js"

const send = (res, statusCode, message, result) => res.status(statusCode).json({ success: true, message, ...result })
export const createGuestRoomController = (req, res) => send(res, 200, "Joined guest room successfully.", createGuestRoom(req.body))
export const createRoomController = (req, res) => send(res, 201, "Room created successfully.", createPrivateRoom(req.body))
export const joinRoomController = (req, res) => send(res, 200, "Joined room successfully.", joinPrivateRoom(req.body))
