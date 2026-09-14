import "./App.css"
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

const API_URL = import.meta.env.VITE_API_URL

function createGuestUsername() {
  return `guest-${Math.random().toString(36).slice(2, 8)}`
}

function getInitialUsername() {
  const storedUsername = window.sessionStorage.getItem("generated-username")?.trim()
  if (storedUsername) {
    return storedUsername
  }

  const nextUsername = createGuestUsername()
  window.sessionStorage.setItem("generated-username", nextUsername)
  return nextUsername
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const providerRef = useRef(null)
  const bindingRef = useRef(null)
  const docRef = useRef(null)

  const [editorReady, setEditorReady] = useState(false)
  const [users, setUsers] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [username, setUsername] = useState(() => getInitialUsername())
  const [createForm, setCreateForm] = useState({
    username: getInitialUsername(),
    roomId: "",
    roomName: "",
    password: "",
  })
  const [joinForm, setJoinForm] = useState({
    roomId: "",
    password: "",
  })
  const [roomSession, setRoomSession] = useState(() => {
    const stored = window.sessionStorage.getItem("room-session")
    return stored ? JSON.parse(stored) : null
  })

  const editorRoomId = location.pathname.match(/^\/editor\/([^/]+)$/)?.[1]
  const isInRoom = Boolean(username && roomSession && editorRoomId === roomSession.roomId)

  const roomSummary = useMemo(() => {
    if (!roomSession) {
      return null
    }

    return {
      roomId: roomSession.roomId,
      roomName: roomSession.roomName,
      createdBy: roomSession.createdBy,
      isGuest: Boolean(roomSession.isGuest),
    }
  }, [roomSession])

  const syncUsers = (provider) => {
    const nextUsers = []
    const seen = new Set()

    for (const state of provider.awareness.getStates().values()) {
      const nextUser = state?.user ?? state
      const key = nextUser?.username?.trim()

      if (!key || seen.has(key)) {
        continue
      }

      seen.add(key)
      nextUsers.push(nextUser)
    }

    setUsers(nextUsers)
  }

  const cleanupRealtime = () => {
    if (providerRef.current?.awareness) {
      providerRef.current.awareness.setLocalState(null)
    }

    bindingRef.current?.destroy()
    bindingRef.current = null

    providerRef.current?.disconnect()
    providerRef.current?.destroy()
    providerRef.current = null

    docRef.current?.destroy()
    docRef.current = null

    setUsers([])
  }

  const handleMount = (editor) => {
    editorRef.current = editor
    setEditorReady(true)
  }

  const handleCreateChange = (event) => {
    const { name, value } = event.target
    setCreateForm((current) => ({ ...current, [name]: value }))
  }

  const handleJoinChange = (event) => {
    const { name, value } = event.target
    setJoinForm((current) => ({ ...current, [name]: value }))
  }

  const persistSession = (session) => {
    setRoomSession(session)
    window.sessionStorage.setItem("room-session", JSON.stringify(session))
  }

  const requestRoom = async (endpoint, payload) => {
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Request failed.")
      }

      const session = {
        username: payload.username?.trim() || username,
        roomId: result.room.roomId,
        roomName: result.room.roomName,
        createdBy: result.room.createdBy,
        isGuest: Boolean(result.room.isGuest),
        roomAccessToken: result.accessToken,
      }

      setUsername(session.username)
      setCreateForm((current) => ({ ...current, username: session.username }))
      setJoinForm((current) => ({ ...current, roomId: result.room.roomId }))
      persistSession(session)
      navigate(`/editor/${session.roomId}`)
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateRoom = async (event) => {
    event.preventDefault()

    await requestRoom("/api/rooms/create", {
      username: createForm.username,
      roomId: createForm.roomId,
      roomName: createForm.roomName,
      password: createForm.password,
    })
  }

  const handleJoinRoom = async (event) => {
    event.preventDefault()

    await requestRoom("/api/rooms/join", {
      username,
      roomId: joinForm.roomId,
      password: joinForm.password,
    })
  }

  const handleGuestRoom = async () => {
    const nextUsername = createGuestUsername()
    window.sessionStorage.setItem("generated-username", nextUsername)
    setUsername(nextUsername)
    setCreateForm((current) => ({ ...current, username: nextUsername }))

    await requestRoom("/api/rooms/guest", {
      username: nextUsername,
    })
  }

  const handleLeaveRoom = () => {
    cleanupRealtime()
    window.sessionStorage.removeItem("room-session")
    const nextUsername = createGuestUsername()
    window.sessionStorage.setItem("generated-username", nextUsername)
    setUsername(nextUsername)
    setCreateForm((current) => ({ ...current, username: nextUsername }))
    setRoomSession(null)
    setErrorMessage("")
    navigate("/")
  }

  useEffect(() => {
    return () => {
      cleanupRealtime()
    }
  }, [])

  useEffect(() => {
    if (!roomSession) {
      cleanupRealtime()
      return
    }

    setUsername(roomSession.username)
    setCreateForm((current) => ({
      ...current,
      username: roomSession.username,
    }))
    setJoinForm((current) => ({
      ...current,
      roomId: roomSession.roomId,
    }))
  }, [roomSession])

  useEffect(() => {
    if (!isInRoom || !editorReady || !editorRef.current) {
      return
    }

    const model = editorRef.current.getModel()
    if (!model) {
      return
    }

    cleanupRealtime()

    const doc = new Y.Doc()
    const yText = doc.getText("monaco")
    const provider = new SocketIOProvider(API_URL, roomSession.roomId, doc, {
      autoConnect: true,
      auth: {
        roomId: roomSession.roomId,
        roomAccessToken: roomSession.roomAccessToken,
      },
    })

    docRef.current = doc
    providerRef.current = provider

    const handleAwarenessChange = () => {
      syncUsers(provider)
    }

    const handleProviderSync = () => {
      syncUsers(provider)
    }

    const handlePresenceUpdate = (nextUsers) => {
      setUsers(nextUsers)
    }

    provider.awareness.on("change", handleAwarenessChange)
    provider.on("sync", handleProviderSync)
    provider.on("status", handleProviderSync)
    provider.socket.on("presence:update", handlePresenceUpdate)

    provider.awareness.setLocalState({
      user: {
        username: roomSession.username,
        roomName: roomSession.roomName,
      },
    })

    bindingRef.current = new MonacoBinding(
      yText,
      model,
      new Set([editorRef.current]),
      provider.awareness,
    )

    syncUsers(provider)

    const handleBeforeUnload = () => {
      provider.awareness.setLocalState(null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      provider.awareness.off("change", handleAwarenessChange)
      provider.off("sync", handleProviderSync)
      provider.off("status", handleProviderSync)
      provider.socket.off("presence:update", handlePresenceUpdate)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      cleanupRealtime()
    }
  }, [editorReady, isInRoom, roomSession])

  const isCreatePage = location.pathname === "/create"
  const isJoinPage = location.pathname === "/join"
  const isGuestPage = location.pathname === "/guest"

  if (isInRoom) {
    return (
      <main className="app-shell">
        <header className="site-header">
          <Link className="brand" to="/"><span className="brand-mark">C</span>Code Collab</Link>
          <nav className="site-nav"><Link to="/">Home</Link></nav>
        </header>
        <section className="workspace-shell">
          <aside className="sidebar">
            <div className="sidebar-card">
              <p className="eyebrow">Connected as</p>
              <h2 className="heading-lg">{username}</h2>
              <p className="subtle-text">{roomSummary?.roomName}</p>
              <div className="room-meta">
                <div>
                  <span>Room ID</span>
                  <strong>{roomSummary?.roomId}</strong>
                </div>
                <div>
                  <span>{roomSummary?.isGuest ? "Access" : "Created by"}</span>
                  <strong>{roomSummary?.isGuest ? "Public guest room" : roomSummary?.createdBy}</strong>
                </div>
              </div>
              <button className="btn-secondary" type="button" onClick={handleLeaveRoom}>
                Leave room
              </button>
            </div>

            <div className="sidebar-card collaborators-card">
              <div className="collaborators-header">
                <h3>Collaborators</h3>
                <span>{users.length}</span>
              </div>
              <ul className="collaborators-list">
                {users.map((user) => (
                  <li key={user.username} className="collaborator-item">
                    <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
                    <div>
                      <strong>{user.username}</strong>
                      <p>Live in room</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="editor-panel">
            <div className="editor-header">
              <div>
                <p className="eyebrow">Protected room</p>
                <h2 className="heading-lg">{roomSummary?.roomName}</h2>
              </div>
              <p className="subtle-text">
                {roomSummary?.isGuest
                  ? "Anyone can enter the shared guest room instantly."
                  : <>Share room ID <strong>{roomSummary?.roomId}</strong> and the password with collaborators.</>}
              </p>
            </div>

            <div className="editor-surface">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                defaultValue="// Start collaborating in this room"
                theme="vs-dark"
                onMount={handleMount}
              />
            </div>
          </section>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/"><span className="brand-mark">C</span>Code Collab</Link>
        <nav className="site-nav"><Link to="/">Home</Link></nav>
      </header>
      <section className="auth-shell">
        <div className="auth-card">
          {isCreatePage || isJoinPage || isGuestPage ? (
            <>
              <div className="auth-header">
                <p className="eyebrow">Realtime workspace</p>
                <h1 className="heading-xl">
                  {isCreatePage ? "Start a private room for collaborative coding." : isJoinPage ? "Join a private room." : "Enter the guest room."}
                </h1>
                <p className="auth-copy">
                  {isGuestPage
                    ? "Join the shared workspace instantly."
                    : "Create a room with a password or join an existing one with the room ID and password."}
                </p>
              </div>

              <div className="mode-switcher">
                <Link className={isCreatePage ? "mode-button active" : "mode-button"} to="/create">Create room</Link>
                <Link className={isJoinPage ? "mode-button active" : "mode-button"} to="/join">Join room</Link>
              </div>

              {isCreatePage ? (
              <form className="room-form" onSubmit={handleCreateRoom}>
                <label className="form-label">
                  <span>Username</span>
                  <input
                    className="input"
                    name="username"
                    value={createForm.username}
                    onChange={handleCreateChange}
                    placeholder="suraj8789"
                    autoComplete="off"
                  />
                </label>

                <label className="form-label">
                  <span>Room name</span>
                  <input
                    className="input"
                    name="roomName"
                    value={createForm.roomName}
                    onChange={handleCreateChange}
                    placeholder="Frontend interview prep"
                    autoComplete="off"
                  />
                </label>

                <label className="form-label">
                  <span>Room ID</span>
                  <input
                    className="input"
                    name="roomId"
                    value={createForm.roomId}
                    onChange={handleCreateChange}
                    placeholder="FRONTEND101"
                    autoComplete="off"
                  />
                </label>

                <label className="form-label">
                  <span>Password</span>
                  <input
                    className="input"
                    name="password"
                    type="password"
                    value={createForm.password}
                    onChange={handleCreateChange}
                    placeholder="Create a room password"
                    autoComplete="off"
                  />
                </label>

                {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create and enter room"}
                </button>
              </form>
              ) : isJoinPage ? (
              <form className="room-form" onSubmit={handleJoinRoom}>
                <label className="form-label">
                  <span>Room ID</span>
                  <input
                    className="input"
                    name="roomId"
                    value={joinForm.roomId}
                    onChange={handleJoinChange}
                    placeholder="A1B2C3"
                    autoComplete="off"
                  />
                </label>

                <label className="form-label">
                  <span>Password</span>
                  <input
                    className="input"
                    name="password"
                    type="password"
                    value={joinForm.password}
                    onChange={handleJoinChange}
                    placeholder="Enter the room password"
                    autoComplete="off"
                  />
                </label>

                {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Joining..." : "Join room"}
                </button>
              </form>
              ) : (
                <button className="btn-primary" type="button" onClick={handleGuestRoom} disabled={isSubmitting}>
                  {isSubmitting ? "Opening guest room..." : "Enter guest room"}
                </button>
              )}
              <p className="auth-copy"><Link to="/">Back to home</Link></p>
            </>
          ) : (
            <div className="home-grid">
              <div>
                <div className="auth-header">
                  <p className="eyebrow">Realtime workspace</p>
                  <h1 className="heading-xl">Code together. Ship at full speed.</h1>
                  <p className="auth-copy">A focused live workspace for pairing, debugging, and turning fast ideas into working code.</p>
                </div>
                <div className="home-actions">
                  <Link className="btn-primary" to="/create">Create room</Link>
                  <Link className="btn-secondary" to="/join">Join room</Link>
                  <Link className="btn-secondary" to="/guest">Guest room</Link>
                </div>
              </div>
              <aside className="home-panel">
                <div className="home-panel-title"><span>Live workspace</span><i className="live-dot" /></div>
                <p className="subtle-text">Private rooms, real-time presence, and shared code in one place.</p>
                <div className="home-stat-grid">
                  <div className="home-stat"><strong>01</strong><span>Create</span></div>
                  <div className="home-stat"><strong>02</strong><span>Invite</span></div>
                  <div className="home-stat"><strong>03</strong><span>Collaborate</span></div>
                  <div className="home-stat"><strong>LIVE</strong><span>Yjs sync</span></div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
