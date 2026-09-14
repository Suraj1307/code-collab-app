export function createGuestUsername() {
  return `guest-${Math.random().toString(36).slice(2, 8)}`
}

export function getInitialUsername() {
  const username = window.sessionStorage.getItem("generated-username")?.trim()
  if (username) return username
  const generated = createGuestUsername()
  window.sessionStorage.setItem("generated-username", generated)
  return generated
}

export function getRoomSession() {
  try {
    const stored = window.sessionStorage.getItem("room-session")
    return stored ? JSON.parse(stored) : null
  } catch {
    window.sessionStorage.removeItem("room-session")
    return null
  }
}

export function saveRoomSession(session) {
  window.sessionStorage.setItem("room-session", JSON.stringify(session))
}
