import { Router } from "express";
import { userRegister, userLogin, logoutUser, refreshAccessToken } from "../controllers/user-controller.js";
import { upload } from "../middlewares/multer-mid.js"
import { verifyJWT } from "../middlewares/auth-mid.js"

const router = Router();

// router.post("/register", userRegister) // 1st method
// router.route("/register").post(userRegister) // 2nd method

// 2nd method with middlewares
router.route("/register").post(
	// this is middleware
	upload.fields([
		{ name: "avatar", maxCount: 1 },
		{ name: "coverImage", maxCount: 1 }
	]),
	userRegister // and this is my controller
)

router.route("/login").post(userLogin)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router