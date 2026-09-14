const activeRoomUsers = new Map()

export function addUserToRoom(roomId, socketId, username) {
  const users = activeRoomUsers.get(roomId) || new Map()
  users.set(socketId, username)
  activeRoomUsers.set(roomId, users)
}

export function removeUserFromRoom(roomId, socketId) {
  const users = activeRoomUsers.get(roomId)
  if (!users) return
  users.delete(socketId)
  if (users.size === 0) activeRoomUsers.delete(roomId)
}

export function broadcastActiveUsers(namespace, roomId) {
  const seen = new Set()
  const users = []
  for (const username of activeRoomUsers.get(roomId)?.values() || []) {
    if (username && !seen.has(username)) { seen.add(username); users.push({ username }) }
  }
  namespace.emit("presence:update", users)
}
