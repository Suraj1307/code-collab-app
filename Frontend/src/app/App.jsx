import "./App.css"
import { Editor } from "@monaco-editor/react"
import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { SiteHeader } from "../components/common/SiteHeader.jsx"
import { HomePanel } from "../components/home/HomePanel.jsx"
import { useCollaboration } from "../hooks/useCollaboration.js"
import { requestRoom } from "../services/api.js"
import { createGuestUsername, getInitialUsername, getRoomSession, saveRoomSession } from "../utils/session.js"

function RoomForm({ mode, form, onChange, onSubmit, errorMessage, isSubmitting }) {
  const creating = mode === "create"
  return <form className="room-form" onSubmit={onSubmit}>
    {creating && <label className="form-label"><span>Username</span><input className="input" name="username" value={form.username} onChange={onChange} placeholder="Your name" autoComplete="off" /></label>}
    {creating && <label className="form-label"><span>Room name</span><input className="input" name="roomName" value={form.roomName} onChange={onChange} placeholder="Frontend interview prep" autoComplete="off" /></label>}
    <label className="form-label"><span>Room ID</span><input className="input" name="roomId" value={form.roomId} onChange={onChange} placeholder="FRONTEND101" autoComplete="off" /></label>
    <label className="form-label"><span>Password</span><input className="input" name="password" type="password" value={form.password} onChange={onChange} placeholder={creating ? "Create a room password" : "Enter the room password"} autoComplete="off" /></label>
    {errorMessage && <p className="form-error">{errorMessage}</p>}
    <button className="btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Connecting..." : creating ? "Create and enter room" : "Join room"}</button>
  </form>
}

function EditorWorkspace({ room, users, onMount, onLeave }) {
  return <main className="app-shell"><SiteHeader /><section className="workspace-shell"><aside className="sidebar"><div className="sidebar-card"><p className="eyebrow">Connected as</p><h2 className="heading-lg">{room.username}</h2><p className="subtle-text">{room.roomName}</p><div className="room-meta"><div><span>Room ID</span><strong>{room.roomId}</strong></div><div><span>{room.isGuest ? "Access" : "Created by"}</span><strong>{room.isGuest ? "Public guest room" : room.createdBy}</strong></div></div><button className="btn-secondary" type="button" onClick={onLeave}>Leave room</button></div><div className="sidebar-card"><div className="collaborators-header"><h3>Collaborators</h3><span>{users.length}</span></div><ul className="collaborators-list">{users.map((user) => <li key={user.username} className="collaborator-item"><div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div><div><strong>{user.username}</strong><p>Live in room</p></div></li>)}</ul></div></aside><section className="editor-panel"><div className="editor-header"><div><p className="eyebrow">{room.isGuest ? "Guest room" : "Protected room"}</p><h2 className="heading-lg">{room.roomName}</h2></div><p className="subtle-text">Share room ID <strong>{room.roomId}</strong> with collaborators.</p></div><div className="editor-surface"><Editor height="100%" defaultLanguage="javascript" defaultValue="// Start collaborating in this room" theme="vs-dark" onMount={onMount} /></div></section></section></main>
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState(getInitialUsername)
  const [createForm, setCreateForm] = useState(() => ({ username: getInitialUsername(), roomId: "", roomName: "", password: "" }))
  const [joinForm, setJoinForm] = useState({ roomId: "", password: "" })
  const [roomSession, setRoomSession] = useState(getRoomSession)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const editorRoomId = location.pathname.match(/^\/editor\/([^/]+)$/)?.[1]
  const room = useMemo(() => roomSession?.roomId === editorRoomId ? roomSession : null, [roomSession, editorRoomId])
  const { users, onMount, cleanup } = useCollaboration(room)
  const page = location.pathname

  const enterRoom = async (endpoint, payload) => {
    setIsSubmitting(true); setErrorMessage("")
    try {
      const result = await requestRoom(endpoint, payload)
      const session = { username: payload.username?.trim() || username, roomId: result.room.roomId, roomName: result.room.roomName, createdBy: result.room.createdBy, isGuest: Boolean(result.room.isGuest), roomAccessToken: result.accessToken }
      window.sessionStorage.setItem("generated-username", session.username)
      setUsername(session.username); setRoomSession(session); saveRoomSession(session); navigate(`/editor/${session.roomId}`)
    } catch (error) { setErrorMessage(error.message || "Something went wrong.") } finally { setIsSubmitting(false) }
  }

  const leaveRoom = () => { cleanup(); window.sessionStorage.removeItem("room-session"); const nextUsername = createGuestUsername(); window.sessionStorage.setItem("generated-username", nextUsername); setUsername(nextUsername); setCreateForm((current) => ({ ...current, username: nextUsername })); setRoomSession(null); navigate("/") }
  if (room) return <EditorWorkspace room={room} users={users} onMount={onMount} onLeave={leaveRoom} />

  const createPage = page === "/create"
  const joinPage = page === "/join"
  const guestPage = page === "/guest"
  const onCreate = (event) => { event.preventDefault(); enterRoom("/api/rooms/create", createForm) }
  const onJoin = (event) => { event.preventDefault(); enterRoom("/api/rooms/join", { username, ...joinForm }) }
  const onGuest = () => { const nextUsername = createGuestUsername(); setUsername(nextUsername); enterRoom("/api/rooms/guest", { username: nextUsername }) }

  return <main className="app-shell"><SiteHeader /><section className="auth-shell"><div className="auth-card">{createPage || joinPage || guestPage ? <><div className="auth-header"><p className="eyebrow">Realtime workspace</p><h1 className="heading-xl">{createPage ? "Start a private room for collaborative coding." : joinPage ? "Join a private room." : "Enter the guest room."}</h1><p className="auth-copy">{guestPage ? "Join the shared workspace instantly." : "Create a room with a password or join an existing room with its room ID and password."}</p></div><div className="mode-switcher"><Link className={createPage ? "mode-button active" : "mode-button"} to="/create">Create room</Link><Link className={joinPage ? "mode-button active" : "mode-button"} to="/join">Join room</Link></div>{createPage && <RoomForm mode="create" form={createForm} onChange={(event) => setCreateForm({ ...createForm, [event.target.name]: event.target.value })} onSubmit={onCreate} errorMessage={errorMessage} isSubmitting={isSubmitting} />}{joinPage && <RoomForm mode="join" form={joinForm} onChange={(event) => setJoinForm({ ...joinForm, [event.target.name]: event.target.value })} onSubmit={onJoin} errorMessage={errorMessage} isSubmitting={isSubmitting} />}{guestPage && <button className="btn-primary" type="button" onClick={onGuest} disabled={isSubmitting}>{isSubmitting ? "Connecting..." : "Enter guest room"}</button>}<p className="auth-copy"><Link to="/">Back to home</Link></p></> : <div className="home-grid"><div><div className="auth-header"><p className="eyebrow">Realtime workspace</p><h1 className="heading-xl">Code together. Ship at full speed.</h1><p className="auth-copy">A focused live workspace for pairing, debugging, and turning fast ideas into working code.</p></div><div className="home-actions"><Link className="btn-primary" to="/create">Create room</Link><Link className="btn-secondary" to="/join">Join room</Link><Link className="btn-secondary" to="/guest">Guest room</Link></div></div><HomePanel /></div>}</div></section></main>
}
