import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/videos.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/apiError.js"
import { APiResponce } from "../utils/apiResponce.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/Cloudinary.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    page = isNaN(page) ? 1 : Number(page)
    limit = isNaN(limit) ? 1 : Number(limit)
    if (page <= 0) {
        page = 1
    }
    if (limit <= 0) {
        limit = 10
    }

    const matchOwner = {}
    if (userId && isValidObjectId(userId)) {
        matchOwner["$match"] = {
            owner: new mongoose.Types.ObjectId(userId)
        }
    }
    else if (query) {
        matchOwner["$match"] = {
            $or: [
                { title: { $regex: query, options: 'i' } },
                { description: { $regex: query, options: 'i' } }
            ]
        }
    }
    else {
        matchOwner["$match"] = {}
    }
    if (userId && query) {
        matchOwner["$match"] = {
            $and: {
                owner: new mongoose.Types.ObjectId(userId),
                $or: [
                    { title: { $regex: query, options: 'i' } },
                    { description: { $regex: query, options: 'i' } }
                ]
            }
        }
    }

    const joinOwner = {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        avatar: 1,
                        fullname: 1
                    }
                }
            ]
        }
    }
    const addFields = {
        $addFields: {
            owner: {
                $first: "$owner"
            }
        }
    }
    const sortingStage = {}
    if (sortBy && sortType) {
        sortingStage["$sort"] = {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    } else {
        sortingStage["$sort"] = {
            createdAt: -1
        }
    }
    const skipStage = { $skip: (page - 1) * limit };
    const limitStage = { $limit: limit };

    const video = await Video.aggregate([
        matchOwner,
        joinOwner,
        addFields,
        sortingStage,
        skipStage,
        limitStage
    ])

    res
    .status(200)
    .json(
        new APiResponce(200,video,"got all videos succesfully")
    )

}
)

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    if (!(title?.trim()) || !(description?.trim())) {
        throw new ApiError(404, "title and description reqired")
    }
    // TODO: get video, upload to cloudinary, create video.

    if (!(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0)) {
        throw new ApiError(400, "Video file is required!!!");
    }
    const videoFilePath = req.files.videoFile[0].path
    const thumbnailFilePath = req.files.thumbnail[0].path

    if (!videoFilePath) {
        throw new ApiError(404, "Video file is required")
    }
    if (!thumbnailFilePath) {
        throw new ApiError(404, "Thumbnail file is required")
    }
    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath);
    if (!videoFile) {
        throw new ApiError(401, "File not uploaded !!");
    }
    if (!thumbnailFile) {
        throw new ApiError(401, "File not uploaded !!");
    }

    const video = await Video.create({
        Title: title.trim(),
        Description: description,
        videoFile: videoFile.url,
        Thumbnail: thumbnailFile.url,
        owner: req.user._id,
        Duration: Math.round(videoFile.duration)

    })
    console.log(video._id)
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
    /* information we need :
      owner : username ,
              avatar,
              fullname.
       no.of likes ,
       no.of views.
    
    */

    if (!videoId.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is Required")
    }
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        avatar: 1,
                        fullname: 1
                    }
                }]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likes: {
                    $size: "$likes"
                },
                views: {
                    $add: [1, "$views"]
                }
            }
        }
    ])
    console.log(video)
    if (video.length > 0) {
        video = video[0]
    }
    await Video.findByIdAndUpdate(videoId, {
        $set: {
            views: video.views
        }
    })

    res
        .status(200)
        .json(
            new APiResponce(200, video, "Single video recieved succcesfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body
    if (!title || !description) {
        throw new ApiError(401, "title and description are required")
    }
    if (!videoId) {
        throw new ApiError(400, "video is not avaliable")
    }
    const thumbnailFilePath = req.files?.path
    if (!thumbnailFilePath) {
        throw new ApiError(400, "Thumnail is required")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailFilePath)
    if (!thumbnail) {
        throw new ApiError(400, "file is not uploaded on cloudinary")
    }
    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                Title: title,
                Description: description,
                Thumbnail: thumbnail.url
            }
        },
        {
            new: true
        }
    )
    res
        .status(200)
        .json(
            new APiResponce(200, video, "Video details updated succesfully")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId?.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is required or invalid");
    }
    console.log(videoId)
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video is not avaliable")
    }
    if (!(video?.owner?._id.toString() === req.user?._id.toString())) {
        throw new ApiError(300, "unauthorized request")
    }
    const { _id, thumbnail, videoFile } = video;
    const deleteResponce = await Video.findByIdAndDelete(_id);
    console.log(deleteResponce)
    if (deleteResponce) {
        await Promise.all([
            Like.deleteMany({ video: _id }),
            Comment.deleteMany({ video: _id }),
            deleteFromCloudinary(videoFile, "Video"),
            deleteFromCloudinary(thumbnail),
        ])
    }
    else {
        throw new ApiError(500, "Something went wrong while deleting video");
    }
    res
        .status(200)
        .json(200, {}, "Video deleted Succesfully")


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is not avaliable")
    }
    const { video } = await Video.findById(video);
    if (!video) {
        throw new ApiError(400, "video is not avaliable")
    }
    video.Ispublished = !(video.Ispublished)
    await video.save();

    res
        .status(200)
        .json(
            new APiResponce(200, video, "Video publish status updated Succesfully")
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