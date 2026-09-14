import crypto from "node:crypto"

export const createAccessToken = () => crypto.randomBytes(24).toString("hex")
