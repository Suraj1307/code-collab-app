const API_URL = import.meta.env.VITE_API_URL

export async function requestRoom(endpoint, payload) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (!response.ok || !result.success) throw new Error(result.message || "Request failed.")
    return result
  } catch (error) {
    if (error instanceof TypeError) throw new Error("Unable to reach the collaboration server. Please try again.")
    throw error
  }
}
