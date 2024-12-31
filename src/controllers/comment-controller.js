import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment-model.js"
import { Video } from "../models/video-model.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
	//TODO: get all comments for a video
	const { videoId } = req.params 
	// this controller can also hadle page and limit dynamically by sending from frontend
	const { page = 1, limit = 10 } = req.query
	if(!videoId) {
		throw new ApiError(404, "video Id is required")
	}
	if(!isValidObjectId(videoId)) {
		throw new ApiError(401, "Invalid video Id")
	}

	let pageNo = page || 1;
	let perPage = limit || 10;
	let totalPosts = await Comment.countDocuments({video: new mongoose.Types.ObjectId(videoId)});
	let totalPages = Math.ceil(totalPosts/perPage)
	// console.log(pageNo, perPage, totalPosts, totalPages)

	if(pageNo > totalPages) {
		return res.status(404).json({message: `page ${pageNo} not found`})
	}
	  
	const comments = await Comment.find({video: new mongoose.Types.ObjectId(videoId)})
	.select("comment owner createdAt").populate({path: "owner", select: "username avatar"})
	.skip((pageNo - 1) * perPage)
	.limit(perPage)

	// console.log(comments)
	if(!comments) {
		throw new ApiError(404, "No comments found")
	}

	// add new custom fields
	const newCommentsWithAddTwoFields = [
		...comments,
		{currentPage: pageNo}, // new field
		{totalPages: totalPages}, // new field
		{totalPosts: totalPosts} // new field
	]

	// console.log(newCommentsWithAddTwoFields)

	return res
	.status(200)
	.json(
		new ApiResponse(200, newCommentsWithAddTwoFields, "All Comments fetched successfully of this video")
	)

})

const addComment = asyncHandler(async (req, res) => {
	// TODO: add a comment to a video
	const {videoId} = req.params;
	const {comment} = req.body;
	if(!videoId) {
		throw new ApiError(404, "videoId not found")
	} 
	if(!comment) {
		throw new ApiError(404, "comment not found")
	}
	if(!isValidObjectId(videoId)) {
		throw new ApiError(400, "invalid videoId")
	}
 
	const video = await Video.findById(videoId); 
	// console.log(video)

	if(!video) {
		throw new ApiError(404, "failed to find a video")
	}

	const addComment = await Comment.create({
		comment,
		video: video?._id,
		owner: req.user?._id
	})
	// console.log(addComment)
	if(!comment) {
		throw new ApiError(500, "Failed to add comment")
	}

	return res
	.status(200)
	.json(
		new ApiResponse(200, addComment, "Comment added successfully")
	)

})

const updateComment = asyncHandler(async (req, res) => {
	// TODO: update a comment
	const {commentId} = req.params;
	const {comment} = req.body; 
	if(!commentId) {
		throw new ApiError(404, "comment id is required")
	}
	if(!isValidObjectId(commentId)) {
		throw new ApiError(400, "Invalid comment Id")
	}
	if(!comment) {
		throw new ApiError(404, "comment is required")
	}

	const UserComment = await Comment.findById(commentId)
	// console.log(UserComment)
	if(!UserComment) {
		throw new ApiError(404, "comment not found")
	}
	// console.log(UserComment.owner.toString())
	// console.log(req.user?._id.toString())

	if(UserComment.owner.toString() !== req.user?._id.toString()) {
		throw new ApiError(404, "only comment owner can update this comment")
	}

	const updatedComment = await Comment.findByIdAndUpdate(
		commentId, 
		{
			$set: {
				comment
			}
		},
		{
			new: true
		}
	)
	if(!updateComment) {
		throw new ApiError(500, "failed to update comment") 
	}

	return res
	.status(200)
	.json(
		new ApiResponse(200, updatedComment, "comment updated successfully")
	)

})

const deleteComment = asyncHandler(async (req, res) => {
	// TODO: delete a comment
	const {commentId} = req.params;
	if(!commentId) {
		throw new ApiError(404, "comment id is required")
	}
	if(!isValidObjectId(commentId)) {
		throw new ApiError(400, "Invalid comment Id")
	}

	const UserComment = await Comment.findById(commentId) 
	// console.log(UserComment)
	if(!UserComment) {
		throw new ApiError(404, "comment not found")
	} 

	if(UserComment.owner.toString() !== req.user?._id.toString()) {
		throw new ApiError(404, "only comment owner can delete this comment")
	}

	const deletedComment = await Comment.findByIdAndDelete(commentId)
	if(!deletedComment) {
		throw new ApiError(404, "failed to delete this comment")
	} 

	return res
	.status(200)
	.json(new ApiResponse(200, {}, "comment deleted successfully"))

})

export {
	getVideoComments,
	addComment,
	updateComment,
	deleteComment
}