import mongoose, {isValidObjectId} from "mongoose" 
import { Subscription } from "../models/subscription-model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params // channelId means userId
    // TODO: toggle subscription
	
	if(!channelId) {
		throw new ApiError(404, "channel id must be required")
	}
	if(!isValidObjectId(channelId)) {
		throw new ApiError(400, "Invalid channelId")
	}

	const alreadySub = await Subscription.findOne({subscriber: req.user?._id, channel: channelId})
	// console.log(alreadySub)
	if(alreadySub) {
		await Subscription.findByIdAndDelete(alreadySub._id);
		return res.status(200).json(new ApiResponse(
			200, 
			{ subscribed: false },
            "Unsubscribed"
		))
	}

	await Subscription.create({subscriber: req.user?._id, channel: channelId});

	return res.status(200).json(new ApiResponse(
		200,
		{ subscribed: true },
		"subscribed successfully")
	)

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params; 
	if(!channelId) {
		throw new ApiError(404, "channelId must be required")
	}
	if(!isValidObjectId(channelId)) {
		throw new ApiError(400, "Invalid channelId")
	}

	// channel se subscribers mily ga
	const totalSubscribers = await Subscription.find({channel: channelId})
	.select("subscriber")
	.populate({path: "subscriber", select: "username avatar"}) 

	// console.log(totalSubscribers)

	let totalSubInNumbers = totalSubscribers.length

	if(!totalSubInNumbers) {
		throw new ApiError(500, "Failed to find subscribers")
	} 

	const data = {
		Subscribers: totalSubInNumbers,
		totalSubscribers
	}

	return res 
	.status(200)
	.json(
		new ApiResponse(200, data, "fetch subscribers successfully")
	)

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
	if(!subscriberId) {
		throw new ApiError(404, "subscriberId must be required")
	}
	if(!isValidObjectId(subscriberId)) {
		throw new ApiError(400, "Invalid subscriberId")
	}

	const totalChannels = await Subscription.find({subscriber: subscriberId})
	.select("channel")
	.populate({ path: "channel", select: "username avatar" })

	// console.log(totalChannels)

	let totalChaInNumbers = totalChannels.length

	if(!totalChannels) {
		throw new ApiError(500, "faild to fetch total channels")
	}

	const data = {
		Channels: totalChaInNumbers,
		totalChannels
	};

	return res
	.status(200)
	.json(
		new ApiResponse(200, data, "fetch channels successfully")
	)

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}