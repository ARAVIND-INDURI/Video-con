import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subcriptions.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(401, "channel id not avaliable or not valid")
    }
    let channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Unable to find the Channel")
    }
    let subcribing
    const alredySubcribed = await Subscription.findOne({ channel: channelId.trim(), subcriber: req.user._id })
    if (alredySubcribed) {
        await Subscription.deleteOne({ channel: channelId.trim(), subcriber: req.user._id })
        subcribing = false
    }
    else {
        await Subscription.create({ channel: channelId.trim(), subcriber: req.user._id })
        subcribing = true
    }

    const messege = subcribing ? "Subcribed to Channel" : "UnSubcribed to channel"
    res
        .status(200)
        .json(new ApiResponse(200, messege, "Toggled Subcription Succesfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel id is not avaliable or invalid")
    }
    const subcribers = await mongoose.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subcriber",
                foreignField: "_id",
                as: "subcribers",
                pipeline: {
                    $project: {
                        avatar: 1,
                        username: 1,
                        fullname: 1
                    }
                }
            }
        },
        {
            $addFields: {
                $subcribers: {
                    $first: "$subcribers"
                }
            }
        },
        {
            $project: {
                subcribers: 1,
                _id: 0
            }
        },
        {
            $replaceRoot: {
                newRoot: "$subcribers"
            }
        }
    ])
    res
        .status(200)
        .json(
            new ApiResponse(200, subcribers, "Retrived the all the Subcribers Succesfully")
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Subcriber id is not avaliable or invalid")
    }

    const channels = await mongoose.aggregate([
        {
            $match: {
                subcriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                form: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1,
                            fullname: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                $channels: {
                    $first: "$channels"
                }
            }
        },
        {
            $project: {
                channels: 1,
                _id: 0
            }
        },
        {
            $replaceRoot: {
                newRoot: "$channels"
            }
        }
    ])
    res
    .status(200)
    .json(
        new ApiResponse(200 , channels,"Subcribed channels retrived succesfully"))
        
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}