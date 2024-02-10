import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/apiError.js"
import { APiResponce } from "../utils/apiResponce.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content.trim()) {
        throw new ApiError(400, "Content is Required")
    }
    let tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    })
    if (!tweet) {
        throw new ApiError(501, "Unable to Create tweet")
    }

    tweet = await Tweet.findById(tweet._id).populate("owner", "avatar username fullname")

    res
        .status(200)
        .json(
            new APiResponce(200, tweet, "Tweet Created Succesfully")
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    let { page = 1, limit = 10, userId } = req.params
    page = isNaN(page) ? 1 : Number(page)
    limit = isNaN(limit) ? 10 : Number(limit)
    if (page <= 0) {
        page = 1
    }
    if (limit <= 0) {
        limit = 10
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $skip: (page - 1) * limit
        }, {
            $limit: limit
        }

    ])
    if (!tweets) {
        throw new APiResponce(500, "Unable to get all the Tweets")
    }

    res
        .status(200)
        .json(
            new APiResponce(200, tweets, "Retrived all The tweets succesfully")
        )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    if (!tweetId.trim() || !isValidObjectId(tweetId)) {
        throw new ApiError("Inavalid or Unable to find Tweet Id")
    }
    const content = req.body.content
    if (!(content.trim())) {
        throw new ApiError(401, "content is required")
    }
    let tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(500, "Unable to find the Tweet")
    }
    if ((tweet.owner._id.toString()) !== (req.user?._id.toString())) {
        throw new ApiError(402, "You Cannot Update the Tweet")
    }
    tweet = await Tweet.findByIdAndUpdate(tweet._id, {
        $set: {
            content: content
        }
    },
        { new: true })
    res
        .status(200)
        .json(
            new APiResponce(200, tweet, "Tweet Updated SuccesFully")
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet id is Not avalialble  or not valid")
    }
    let tweet = await Tweet.findById(tweetId)
    if ((tweet.owner._id.toString()) !== (req.user._id.toString())) {
        throw new ApiError(401, "you cannot Delete the tweet")
    }
    await Tweet.findByIdAndDelete(tweetId)
    res
        .status(200)
        .json(new APiResponce(200, {}, "Tweet Deleted Succesfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}