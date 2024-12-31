import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist-model.js"
import {Video} from "../models/video-model.js" 
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
	//TODO: create playlist
    const {name, description} = req.body 
	// console.log(name, description)
	if(!name) {
		throw new ApiError(404, "name is required")
	}

	if(!description) {
		throw new ApiError(404, "description is required")
	}

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id 
    })

    if(!playlist._id) {
        throw new ApiError(500, "Playlist is not created!")
    }

	return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist,
            "Playlist is created successfully"
        )
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId) {
        throw new ApiError(404, "userId not found")
    }

    if(!isValidObjectId(userId)) {
        throw new ApiError(404, "Invalid user Id")
    }

    let ownerId = userId
    // console.log(ownerId)

    const userPlaylists = await Playlist.find({owner: ownerId})
    // console.log(userPlaylists)

    if(!userPlaylists?.length) {
        res.json({message: "This user has no playlist"})
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylists, "All playlists fetched successfully")
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId) {
        throw new ApiError(404, "playlistId not found")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos"); 

    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // console.log(playlist)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist is found successfully")
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId) {
        throw new ApiError(404, "playlistId is required")
    } 

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    if(!videoId) {
        throw new ApiError(404, "videoId is required")
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if(!playlist) {
        throw new ApiError(404, "playlist not found")
    }
    if(!video) {
        throw new ApiError(404, "video not found")
    }
    // console.log(playlist, video)
    // console.log(playlist.owner?.toString())
    // console.log( video.owner?.toString())
    // console.log( req.user?._id.toString())

    if(playlist.owner?.toString() && video.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "only owner can add video to their playlist");
    }

    if(playlist.videos.includes(video?._id)){
        console.log("this video is already exists in this playlist")
    }

    const addVideoToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            // $addtoset operator Adds an element to an array, only if it doesn't already exist(overwrite if dublicate)
            // $push operator Adds an element to an array, Even if it already exist(dulicate element)
            $addToSet: { 
                videos: video?._id
            }
        },
        {
            new: true
        }
    );

    // console.log(addVideoToPlaylist)
    if(!addVideoToPlaylist._id) {
        throw new ApiError(500, "Failed to add video to playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            addVideoToPlaylist,
            "Video is added to playlist"
        )
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId) {
        throw new ApiError(404, "playlistId is required")
    } 

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    if(!videoId) {
        throw new ApiError(404, "videoId is required")
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if(!playlist) {
        throw new ApiError(404, "playlist not found")
    }
    if(!video) {
        throw new ApiError(404, "video not found")
    }

    if(playlist.owner?.toString() && video.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "only owner can remove a video to their playlist");
    }

    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            // $pull removes an element to an array
            $pull: { 
                videos: video?._id
            }
        },
        {
            new: true
        }
    );

    // console.log(removeVideoFromPlaylist)
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            removeVideoFromPlaylist,
            "removed video from playlist successfully"
        )
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId) {
        throw new ApiError(404, "playlistId is required")
    } 

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId)
    // console.log(playlist)
    // console.log(playlist.owner.toString())
    // console.log(req.user?._id.toString())

    if(playlist.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only owner can Delete this playlist!")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId) 
    // console.log(deletedPlaylist)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist is deleted successfully")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId) {
        throw new ApiError(404, "playlistId is required")
    }
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }
    if(!name) {
        throw new ApiError(404, "name is required")
    }
    if(!description) {
        throw new ApiError(404, "description is required")
    }

    const playlist = await Playlist.findById(playlistId) 

    if(playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only owner can Delete this playlist!")
    }

 
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, { $set: {name, description} }, { new: true });
    // console.log(updatedPlaylist)

    if(!updatedPlaylist) {
        throw new ApiError(500, "Failed to update a playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist is updated successfully"
        )
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}