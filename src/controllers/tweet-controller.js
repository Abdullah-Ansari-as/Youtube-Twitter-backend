import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet-model.js" 
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
	const {content} = req.body;
	if(!content) {
		throw new ApiError(404, "Tweet content is required")
	}

	const tweet = await Tweet.create({
		content,
		owner: req.user?._id
	})
	if (!tweet) {
        throw new ApiError(500, "failed to create tweet please try again");
    }

	return res
	.status(200)
	.json(
		new ApiResponse(200, tweet, "Tweet created successfully")
	)
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
	const {userId} = req.params;
	if(!userId){
		throw new ApiError(404, "userId is required")
	}
	if(!isValidObjectId(userId)) {
		throw new ApiError(400, "Invalid userId")
	}

	let ownerId = userId;
	// console.log(ownerId)

	const alltweets = await Tweet.find({owner: ownerId}).populate("owner")
	// console.log(alltweets)
	if(!alltweets?.length) {
		throw new ApiError(500, "Failed to fetch all tweets")
	}

	return res
	.status(200)
	.json(
		new ApiResponse(200, alltweets, "All tweets fetched successfully")
	)

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
	const {tweetId} = req.params;
	const {content} = req.body;

	if(!tweetId) {
		throw new ApiError(404, "tweetId not found")
	}
	if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }
	if(!content) {
		throw new ApiError(404, "tweet content not found")
	}

	const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit thier tweet");
    }

	const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {$set: {content}}, {new: true})
	if(!updatedTweet) {
		throw new ApiResponse(500, "failed to update a tweet")
	}

	return res
	.status(200)
	.json(
		new ApiResponse(200, updatedTweet, "tweet is updated successfully")
	)
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
	const {tweetId} = req.params; 
	if(!tweetId) {
		throw new ApiError(404, "tweetId not found")
	}
	if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

	if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

	const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

	return res
	.status(200)
	.json(new ApiResponse(200, {}, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}