export class AppError extends Error {
  constructor(statusCode, message) { super(message); this.statusCode = statusCode }
}

export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500
  if (statusCode >= 500) console.error("Unhandled request error:", error)
  res.status(statusCode).json({ success: false, message: statusCode >= 500 ? "Unable to process the request." : error.message })
}
