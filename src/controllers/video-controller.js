import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video-model.js"
import { User } from "../models/user-model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // const user = await User.findById(req.user?._id)
    // console.log(user)
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title && !description) {
        throw new ApiError(400, "All fields are required!");
    }

    const localVideoFilePath = req.files?.videoFile[0]?.path;
    const localThumbnailFilePath = req.files?.thumbnail[0]?.path;
    // console.log(localVideoFilePath, localThumbnailFilePath)

    if (!localVideoFilePath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!localThumbnailFilePath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(localVideoFilePath)
    const thumbnailFile = await uploadOnCloudinary(localThumbnailFilePath)
    // console.log(videoFile)

    if (!videoFile) {
        throw new ApiError(400, "video file not found")
    }

    if (!thumbnailFile) {
        throw new ApiError(400, "thumbnail file not found")
    }

    // console.log(vidoFile.secure_url, thumbnailFile.secure_url)

    const video = await Video.create({
        title,
        description,
        videoFile: {
            url: videoFile.secure_url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnailFile.secure_url,
            public_id: thumbnailFile.public_id
        },
        time: Math.floor(videoFile.duration),
        isPublished: false,
        owner: req.user?._id
    })
    // console.log(video)
    const uploadedVideo = await Video.findById(video._id);

    if (!uploadedVideo) {
        throw new ApiError(500, "video Upload failed please try again !!!");
    }

    return res.status(200).json(new ApiResponse(200, video, "video uploaded successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // console.log(videoId)
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(404, "video id not found")
    }

    const video = await Video.findById(videoId);
    // console.log(video)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "find a video successfully")
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    //TODO: update video details like title, description, thumbnail

    // console.log(req.file)

    const localThumbnailFilePath = req.file?.path
    // console.log("thumbnail file path is: ", localThumbnailFilePath)

    if (!localThumbnailFilePath) {
        throw new ApiError(500, "failed to find local thumbnail file path")
    }

    const updatedThumbnail = await uploadOnCloudinary(localThumbnailFilePath);
    if (!updatedThumbnail) {
        throw new ApiError(500, "failed to upload new thumbnail file")
    }
    // console.log("updated thumbnail url is: ",updatedThumbnail.secure_url)
    // console.log(updatedThumbnail)

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:
            {
                thumbnail: {
                    url: updatedThumbnail.secure_url,
                    public_id: updatedThumbnail.public_id
                },
                title,
                description
            }
        },
        {
            new: true
        }
    );
    // console.log(updatedVideoDetails)

    if(!updatedVideoDetails) {
        throw new ApiError(500, "Failed to updated video details: thumbnail, title, description")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideoDetails, "Update a video details successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    
    if(!videoId) {
        throw new ApiError(404, "video Id not found")
    }

    const video = await Video.findById(videoId)
    // console.log(video.thumbnail.public_id)
    // console.log(video.owner.toString())

    if(!video) {
        throw new ApiError(404, "video not found")
    }
    //  console.log(req.user._id)

    let currentVideoId = video.owner.toString();
    let currentUserId = req.user?._id.toString();

    // console.log(currentVideoId, currentUserId)
    if(currentVideoId !== currentUserId) {
        throw new ApiError(401, "You are not able to delete this video") 
    }

    const deletedVideoInBd = await Video.findByIdAndDelete(videoId);
    if (!deletedVideoInBd) {
        throw new ApiError(400, "Failed to delete the video in db please try again");
    }

    const deletedThumbnail = await deleteOnCloudinary(video.thumbnail.public_id, "image"); // first is 'public_id' and second is 'resource_typr'
    const deletedVideo = await deleteOnCloudinary(video.videoFile.public_id, "video");

    // console.log(deletedThumbnail, deletedVideo)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
    
})

const togglePublishStatus = asyncHandler(async (req, res) => { 
    const { videoId } = req.params
    // console.log(videoId)

    if(!videoId) {
        throw new ApiError(404, "video Id not found")
    }

    const video = await Video.findById(videoId)
    // console.log(video)
    if(!video) {
        throw new ApiError(404, "video not found")
    }

    if(video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError( 
            400,
            "You can't toogle publish status as you are not the owner"
        )
    }

    const toggleVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );
    // console.log(toggleVideoPublish)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            { isPublished: toggleVideoPublish.isPublished }, 
            "Video publish toggled successfully"
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}