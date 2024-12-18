import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; 
import { User } from "../models/user-model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// this method used in login 
const generateAccessAndRefreshTokens = async (userId) => {
	try {
		const user = await User.findById(userId)
		const accessToken = user.generateAccessToken()
		const refreshToken = user.generateRefreshToken()

		user.refreshToken = refreshToken
		await user.save({ validateBeforeSave: false })

		return {accessToken, refreshToken}

	} catch (error) {
		throw new ApiError(500, "Something went wrong while generating refreah and access token")
	}
} 


const userRegister = asyncHandler( async (req, res) => {

	/* get user details from frontend
	 validation - not empty
	 check if user already exists: username, email
	 check for images, check for avatar
	 upload them to cloudinary, avatar
	 create user object - create entry in db
	 remove password and refresh token field from response
	 check for user creation
	 return res */

	const { fullName, email, username, password } = req.body;
	// console.log(fullName)

	/*  some method returns true if At least one element in the array satisfies the condition.
	  mean k agr koi b field empty hui to ya true return kra ga. */
	if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
		throw new ApiError(400, "All fiels are required!")
	} 

	/* The $or operator allows you to perform a logical OR operation.
	 It takes an array of conditions, and if any one of the conditions is true,
	 the query will match the document.
	 mean k agr dono ma se ik b match ho gya to user return kr de ga. */
	const existedUser = await User.findOne({ $or: [{ username }, { email }] })
	if (existedUser) {
		throw new ApiError(409, "User with email or username already exists")
	}

	// console.log(req.files)

	const avatarLocalPath = req.files?.avatar[0]?.path;
	// const coverImageLocalPath = req.files?.coverImage[0]?.path; // agr user ne coverimage na di to is code se error a skta hai. [avatarLocalPath] ka validation bad ma check kr rha hain.

	let coverImageLocalPath;
	if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
		coverImageLocalPath = req.files.coverImage[0].path
	}
	
	if(!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is requierd!")
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath)
	const coverImage = await uploadOnCloudinary(coverImageLocalPath)
	// console.log(avatar)

	if(!avatar) {
		throw new ApiError(400, "Avatar file is requierd!")
	}

	const user = await User.create({
		fullName,
		avatar: avatar.url,
		coverImage: coverImage?.url || "",
		email,
		password,
		username: username.toLowerCase()
	})

	const createdUser = await User.findById( user._id ).select("-password -refreshToken");

	if(!createdUser) {
		throw new ApiError(500, "Something went wrong while registering the user")
	}

	return res.status(201).json(
		new ApiResponse(200, createdUser, "User registered Successfully")
	)
	
})

const userLogin = asyncHandler( async (req, res) => {
  /* req body -> data
     username or email
     find the user
     password check
     access and referesh token
     send cookie */

	const {username, email, password} = req.body;

	if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

	const user = await User.findOne({ $or: [{username}, {email}] })

	if(!user){
		throw new ApiError(404, "User does not exist");
	}

	// isPasswordCorrect user-models se a rha hai
	const isPasswordValid = await user.isPasswordCorrect(password);

	if(!isPasswordValid){
		throw new ApiError(401, "Invalid User Credentials");
	}

	const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

	const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

	const options = { httpOnly: true, secure: true}

	return res
	.status(200)
	.cookie("accessToken", accessToken, options)
	.cookie("refreshToken", refreshToken, options)
	.json(
		new ApiResponse(
			200,
			{user: LoggedInUser, accessToken, refreshToken},
			"User LoggedIn Successfully"
		)
	)
	
})

const logoutUser = asyncHandler( async (req, res) => {
	await User.findByIdAndUpdate(req.user._id, {$set: {refreshToken: undefined}}, {new: true})
	const options = { httpOnly: true, secure: true}
	return res
	.status(200)
	.clearCookie("accessToken", options)
	.clearCookie("refreshToken", options)
	.json(
		new ApiResponse(200, {}, "User Logged Out")
	)
})

const refreshAccessToken = asyncHandler( async (req, res) => {
	const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

	if(!incomingRefreshToken){
		throw new ApiError(401, "Unauthorized request")
	}

	try {
		const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
	
		const user = await User.findById(decodedToken?._id)
		if(!user){
			throw new ApiError(401, "Invalid refresh Token")
		}	
	
		if (!incomingRefreshToken !== user?.refreshToken) {
			throw new ApiError(401, "Refresh token is expired or used");
		}
	
		const options = {
			httpOnly: true,
			secure: true
		}
	
		const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
	
		return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", newRefreshToken, options)
		.json(
			new ApiResponse(
				200, 
				{accessToken, refreshToken: newRefreshToken},
				"Access token refreshed"
			)
		)
	} catch (error) {
		throw new ApiError(401, error?.message || "Invalid refresh token")
	}

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
	const {oldPassword, newPassword} = req.body;

	const user = await findById(req.user?._id)
	const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

	if(!isPasswordCorrect) {
		throw new ApiError(400, "Invalid old password")
	}

	user.password = newPassword;
	await user.save({validateBeforeSave: true});
	
	return res
	.status(200)
	.json(new ApiResponse(200, {}, "Password changed Successfully"))

})

const getCurrentUser = asyncHandler( async (req, res) => {
	return res
	.status(200)
	.json(200, req.user, "current user fetched successfully")
}) 

const updateAccountDetails = asyncHandler( async (req, res) => {
	const {fullName, email} = req.body;

	if(!fullName || !email) {
		throw new ApiError(400, "All fields are required")
	}

	const user = await User.findByIdAndUpdate(req.user?._id, {$set:{fullName, email}}, {new: true}).select("-password");

	return res
	.status(200)
	.json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler( async (req, res) => {
	const avatarLocalPath = req.file?.path;

	if(!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is required");
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath)
	
	if(!avatar.url) {
		throw new ApiError(400, "Error while loading on avatar")
	}

	const user = await findByIdAndUpdate(req.user._id, {$set: {avatar: avatar.url}}, {new: true}).select("-password");

	return res
	.status(200)
	.json(new ApiResponse(200, user, "Avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler( async (req, res) => {
	const coverImageLocalPath = req.file?.path;

	if(!coverImageLocalPath) {
		throw new ApiError(400, "CoverImage file is required");
	}

	const coverImage = await uploadOnCloudinary(coverImageLocalPath)
	
	if(!coverImage.url) {
		throw new ApiError(400, "Error while loading on coverImage")
	}

	const user = await findByIdAndUpdate(req.user._id, {$set: {coverImage: coverImage.url}}, {new: true}).select("-password");

	return res
	.status(200)
	.json(new ApiResponse(200, user, "coverImage image updated successfully"))
})


export { 
	userRegister, 
	userLogin, 
	logoutUser, 
	refreshAccessToken, 
	changeCurrentPassword, 
	getCurrentUser, 
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImage
}