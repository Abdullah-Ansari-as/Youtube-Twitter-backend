import { Router } from "express";
import {
	userRegister, 
	userLogin, 
	logoutUser, 
	refreshAccessToken, 
	changeCurrentPassword,
	getCurrentUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImage,
	getUserChannelProfile,
	getWatchHistory
} from "../controllers/user-controller.js";
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
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

/* Data in params */
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router