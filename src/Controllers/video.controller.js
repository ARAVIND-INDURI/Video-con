import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/videos.models.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description} = req.body

    if(!title?.trim() || !description?.trim())
    {
     throw new ApiError(404,"title and description reqired")
    }
    // TODO: get video, upload to cloudinary, create video
    const videoFilePath = req.files?.videoFile[0].path
    const thumbnailFilePath = req.files.Thumbnail[0].path
    // if (req.files && Array.isArray(req.files.videoFilePath) && req.files.videoFilePath.length > 0) {
    //     videoFilePath = req.files.coverImage[0].path
    // }

    if(!videoFilePath)
    {
        throw new ApiError(404,"Video file is required")
    }
    if(!thumbnailFilePath)
    {
        throw new ApiError(404,"Thumbnail file is required")
    }
    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath);
    console.log(videoFile);
    if(!videoFile)
    {
        throw new ApiError(401,"File not uploaded !!");
    }
    if(!thumbnailFile)
    {
        throw new ApiError(401,"File not uploaded !!");
    }

    const video = await Video.create({
        Title:title.trim(),
        Description:description,
        videoFile:videoFile.url,
        Thumbnail:thumbnailFile.url,
        owner : req.user._id,
        Duration : Math.round(videoFile.duration)

    })
    res
    .status(200)
    .json(
        200,
        video,
        "Video uploaded succesfully"
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}