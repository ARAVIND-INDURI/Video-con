import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/apiError.js"
import { APiResponce } from "../utils/apiResponce.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/videos.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist
    if (!name.trim() || !description.trim()) {
        throw new ApiError(401, "name and descripton is Required")
    }
    const playlist = await Playlist.create(
        {
            name: name,
            description: description,
            owner: req.user._id
        })
    if (!playlist) {
        throw new ApiError(500, "Unable to Create a Playlist")
    }
    res
        .status(200)
        .json(
            new APiResponce(200, playlist, "Playlist Created Succesfully")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!userId.trim() || !isValidObjectId(userId)) {
        throw new ApiError(401, "user id is not avaliable or invalid ")
    }
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
            }
        }
    ])
    res
        .status(200)
        .json(
            new APiResponce(200, playlists, "Retrived all playlists of User Succesfully")
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!playlistId?.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId is required or invalid");
    }
    let playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId.trim())
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            videoOwner: {
                                $first: "$videoOwner"
                            }
                        }
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1,
                            videoOwner: 1
                        }
                    }
                ]
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
                            fullname: 1,
                            username: 1,
                            avatar: 1
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
        }
    ]);

    if (playlist.length > 0) {
        playlist = playlist[0];
    } else {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(new APiResponce(
        200,
        playlist,
        "Retrived single playlist successfully"
    ));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !isValidObjectId(playlistId)) {
        new ApiError(401, "playlist id is not avaliable or not valid")
    }
    if (!videoId || !isValidObjectId(videoId)) {
        new ApiError(401, "videoId is not avaliable or not valid")
    }
    const playlist = await Playlist.findById(playlistId)
    if (playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot add a video to playlist")
    }
    if (!playlist) {
        throw new ApiError(404, "Playlist not avaliable")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not avaliable")
    }
    const isExist = playlist.videos.findIndex(v => v.toString() === video._id?.toString());
    if (isExist !== -1) {
        throw new ApiError(400, "This video is already in this playlist");
    }

    playlist.videos.push(video._id);
    await playlist.save();

    res.status(200).json(new APiResponce(
        200,
        playlist,
        "Add video to playlist success"
    ));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        new ApiError(401, "playlist id is not avaliable or not valid")
    }
    if (!videoId || !isValidObjectId(videoId)) {
        new ApiError(401, "videoId is not avaliable or not valid")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not avaliable")
    }
    if (playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You cannot add a video to playlist")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not avaliable")
    }
    playlist.videos = playlist.videos.filter(e => e.toString() !== videoId.toString())
    await playlist.save()

    res
        .status(200)
        .json(new APiResponce(200, {}, "Video Removed from playlist Succesfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!playlistId || !isValidObjectId(playlistId)) {
        new ApiError(401, "playlist id is not avaliable or not valid")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(400, "Playlist is not avaliable")
    }
    if ((playlist.owner._id.toString()) !== (req.user._id.toString())) {
        throw new ApiError(403, "You cannot delete the playlist")
    }
    await Playlist.findByIdAndDelete(playlistId)
    res
        .status(200)
        .json(
            new APiResponce(200, {}, "Playlist is Deleted Succesfully")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(401, "playlist id is not avaliable or invalid ")
    }
    if (!name.trim() || !description.trim()) {
        throw new ApiError(404, "name and description is nedded")
    }
    const playlist = await Playlist.findById(playlistId)
    if (playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you cannot Update the Playlist")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name: name,
                description: description
            }
        }, { new: true })
    res
        .status(200)
        .json(
            new APiResponce(200, updatedPlaylist, "Playlist is updated Succesfully")
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