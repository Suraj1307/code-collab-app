import { useCallback, useEffect, useRef, useState } from "react"
import { MonacoBinding } from "y-monaco"
import { SocketIOProvider } from "y-socket.io"
import * as Y from "yjs"

const API_URL = import.meta.env.VITE_API_URL

export function useCollaboration(room) {
  const editorRef = useRef(null)
  const providerRef = useRef(null)
  const bindingRef = useRef(null)
  const docRef = useRef(null)
  const [editorReady, setEditorReady] = useState(false)
  const [users, setUsers] = useState([])

  const cleanup = useCallback(() => {
    providerRef.current?.awareness?.setLocalState(null)
    bindingRef.current?.destroy()
    bindingRef.current = null
    providerRef.current?.disconnect()
    providerRef.current?.destroy()
    providerRef.current = null
    docRef.current?.destroy()
    docRef.current = null
    setUsers([])
  }, [])

  const onMount = useCallback((editor) => {
    editorRef.current = editor
    setEditorReady(true)
  }, [])

  useEffect(() => {
    if (!room || !editorReady || !editorRef.current) return undefined
    const model = editorRef.current.getModel()
    if (!model) return undefined

    cleanup()
    const doc = new Y.Doc()
    const provider = new SocketIOProvider(API_URL, room.roomId, doc, {
      autoConnect: true,
      auth: { roomId: room.roomId, roomAccessToken: room.roomAccessToken },
    })
    docRef.current = doc
    providerRef.current = provider

    const syncUsers = () => {
      const seen = new Set()
      const nextUsers = []
      for (const state of provider.awareness.getStates().values()) {
        const user = state?.user ?? state
        if (user?.username && !seen.has(user.username)) { seen.add(user.username); nextUsers.push(user) }
      }
      setUsers(nextUsers)
    }
    const onPresence = (nextUsers) => setUsers(nextUsers)
    provider.awareness.on("change", syncUsers)
    provider.on("sync", syncUsers)
    provider.socket.on("presence:update", onPresence)
    provider.awareness.setLocalState({ user: { username: room.username, roomName: room.roomName } })
    bindingRef.current = new MonacoBinding(doc.getText("monaco"), model, new Set([editorRef.current]), provider.awareness)
    syncUsers()

    return () => {
      provider.awareness.off("change", syncUsers)
      provider.off("sync", syncUsers)
      provider.socket.off("presence:update", onPresence)
      cleanup()
    }
  }, [room, editorReady, cleanup])

  return { users, onMount, cleanup }
}
