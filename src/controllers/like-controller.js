import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/likes-model.js" 
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video\
    if (!videoId) {
        throw new ApiError(404, "videoId is required")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const alreadyLiked = await Like.findOne({ video: videoId, likedBy: req.user?._id });
    // console.log(alreadyLiked)
    if (alreadyLiked) {
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }))
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id, 
    });

    return res.status(200).json(new ApiResponse(200, { isLiked: true }))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(404, "commentId is required")
    }
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid commentId");
    }

    const alreadyLiked = await Like.findOne({ comment: commentId, likedBy: req.user?._id });
    // console.log(alreadyLiked)
    if (alreadyLiked) {
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id, 
    });

    return res.status(200).json(new ApiResponse(200, { isLiked: true }))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(404, "tweetId is required")
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweetId");
    }

    const alreadyLiked = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id });
    // console.log(alreadyLiked)
    if (alreadyLiked) {
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id, 
    });

    return res.status(200).json(new ApiResponse(200, { isLiked: true }))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // console.log(req.user._id)

    const likedVideoToASpecificUser = await Like.find({
         likedBy: req.user._id, // Match the specific user
         video: {$exists: true} // only fetch documents where 'video' field exists
        })
        .populate("video")
        .sort({ createdAt: -1 }); // Sort by createdAt in descending order

    // console.log(likedVideoToASpecificUser)
    if(!likedVideoToASpecificUser) {
        throw new ApiError(500, "failed to fetch liked videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideoToASpecificUser, "All liked videos fetched ")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}