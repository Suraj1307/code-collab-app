import { Router } from "express"
import { createGuestRoomController, createRoomController, joinRoomController } from "../controllers/roomController.js"

const router = Router()
const methodNotAllowed = (methods) => (req, res) => res.status(405).json({ success: false, message: `Use ${methods.join(", ")} for this endpoint.` })
router.route("/guest").get(methodNotAllowed(["POST"])).post(createGuestRoomController)
router.route("/create").get(methodNotAllowed(["POST"])).post(createRoomController)
router.route("/join").get(methodNotAllowed(["POST"])).post(joinRoomController)
export default router
