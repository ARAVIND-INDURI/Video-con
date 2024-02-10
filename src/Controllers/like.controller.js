import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/videos.models.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { APiResponce } from "../utils/apiResponce.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401, "Video id is required")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(401, "Video is not avaliable")
    }
    let likeing
    const likedAlready = await Like.findOne({ video: videoId, likedBy: req.user._id })
    if (likedAlready) {
        await Like.deleteOne({ video: videoId, likedBy: likedAlready.likedBy })
        likeing = false
    }
    else {
        await Like.create({ video: videoId, likedBy: req.user._id })
        likeing = true
    }
    const responceMessege = likeing ? "Like added Succesfully" : "Like removed Succesfully"
    res
        .status(200)
        .json(
            new APiResponce(200, responceMessege, "Video like togged succesfully")
        )


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(401, "Comment id is not avaliable")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(401, "Comment is not avaliable")
    }
    let isliking
    const likedAlready = await Like.findOne({ comment: commentId, likedBy: req.user._id })
    if (likedAlready) {
        await Like.deleteOne({ comment: commentId, likedBy: req.user._id })
        isliking = false
    }
    else {
        await Like.create({ comment: commentId, likedBy: req.user._id })
        isliking = true
    }
    const responceMessege = isliking ? "Like added Succesfully" : "Like removed Succesfully"

    res
        .status(200)
        .json(
            new APiResponce(200, responceMessege, "Comment like Toggled Succesfully")
        )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(401, "tweet id is not avaliable")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(401, "tweet is not avaliable")
    }
    let isliking
    const likedAlready = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })
    if (likedAlready) {
        await Like.deleteOne({ tweet: tweetId, likedBy: req.user._id })
        isliking = false
    }
    else {
        await Like.create({ tweet: tweetId, likedBy: req.user._id })
        isliking = true
    }
    const responceMessege = isliking ? "Like added Succesfully" : "Like removed Succesfully"

    res
        .status(200)
        .json(
            new APiResponce(200, responceMessege, "Tweet like Toggled Succesfully")
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    let page,limit;
     page = isNaN(page) ? 1 : Number(page)
     limit = isNaN(page) ? 10 : Number(limit)

    const videos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: {
                    $exists: true
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "Likedvideos",
                pipeline: [
                    {
                        $project: {
                            VideoFile: 1,
                            Thumbnail: 1,
                            Title: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                LikedVideos: {
                    $first: "$Likedvideos"
                }
            }
        },
        {
            $project: {
                LikedVideos: 1,
                _id: 0
            }
        },
        {
            $replaceRoot: { newRoot: "$LikedVideos" }
        }
    ])

    if (!videos) {
        throw new ApiError(401, "Unable to Get Liked Videos")
    }
    res
        .status(200)
        .json(
            new APiResponce(200, videos, "Retrived all Liked Videos")
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}