import mongoose from "mongoose"
import { Video } from "../models/videos.models.js"
import { Subcription } from "../models/subcriptions.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelStats = await mongoose.aggregate(
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
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
                likes: {
                    $size: "$likes"
                }
            }
        },
        {
            $group: {
                id: null,
                totalViews: {
                    $sum: "$views"
                },
                totakLikes: {
                    $sum: "$likes"
                },
                totalVideos: {
                    $sum: 1
                }
            }
        },
        {
            $addFields: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "subcriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subcribersCount"
            }
        },
        {
            $addFields: {
                subcribersCount: {
                    $size: "$subcribersCount"
                }
            }
        },
        {
            $project: {
                _id: 0,
                owner: 0
            }
        }
    )

    if (!channelStats) {
        throw new ApiError(401, "Problem in Retriving Channel stats")
    }
    res
        .status(200)
        .json(
            new ApiResponse(200, channelStats, "Succesfully Retrived Channel Stats")
        )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    let { page = 1, limit = 10, sortBy, sortType } = req.query;
    page = isNaN(page) ? 1 : Number(page)
    limit = isNaN(limit) ? 10 : Number(limit)

    const sortingStage = {}
    if (sortBy && sortType) {
        sortStage["$sort"] = {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    } else {
        sortStage["$sort"] = {
            createdAt: -1
        }
    }

    const getAllVideos = await mongoose.aggregate([
        {
            $match: new mongoose.Types.ObjectId(req.user._id)
        },
        sortingStage,
        {
            $project: {
                videoFile: 1,
                Thumbnail: 1,
                views: 1,
                Duration: 1,
                Title: 1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
         $limit : limit
        }
    ])
    res
    .status(200)
    .json(
        new ApiResponse(200,getAllVideos,"Retrived all Videos")
    )

})

export {
    getChannelStats,
    getChannelVideos
}

