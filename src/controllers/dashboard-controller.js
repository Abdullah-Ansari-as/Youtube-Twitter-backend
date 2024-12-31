import mongoose from "mongoose"
import {Video} from "../models/video-model.js"
import {Subscription} from "../models/subscription-model.js"
import {Like} from "../models/likes-model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
	const userId = req.user?._id;
    // console.log(userId)
	
	const Subscribers = await Subscription.countDocuments({subscriber: userId}); 
    // console.log(Subscribers)
    const videos = await Video.countDocuments({ owner: userId });
    // console.log(videos)
    const likes = await Like.countDocuments({likedBy: userId});
    // console.log(likes)
    const totalViews = await Video.aggregate([
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    // console.log(totalViews[0].totalViews)

    const stats = {
        totalSubscribers: Subscribers || 0,
        totalVideos: videos || 0,
        totalLikes: likes || 0,
        totalViews: totalViews[0].totalView || 0
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, stats, "channel stats fetched successfully")
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;

    const videos = await Video.find({owner: userId}).select("-createdAt -updatedAt -owner")
    // console.log(videos)
    
    if(!videos) {
        throw new ApiError(500, "Failed to fetch videos of this channel")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos, "fetched all videos of a channel successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
}