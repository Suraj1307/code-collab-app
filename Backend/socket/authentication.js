import { getRoomSession } from "../services/roomService.js"
import { normalizeRoomId } from "../utils/room.js"

export const getValidRoomSession = (handshake) => getRoomSession(handshake.auth?.roomId, handshake.auth?.roomAccessToken)
export const getDocumentRoomId = (namespaceName) => normalizeRoomId(namespaceName.slice("/yjs|".length))
