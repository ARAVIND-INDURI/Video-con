import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { APiResponce } from "../utils/apiResponce.js"
import jwt from "jsonwebtoken";
import { mongoose } from "mongoose";

const generateAccessandRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken }
   }

   catch (error) {
      throw new ApiError(500, "Failed to Generate Acces and Refresh Token..")
   }
}

const registerUser = asyncHandler(async (req, res) => {

   // Get user Details from Front end
   // Validation - not empty field from response
   // check if user already exsits: through email,username
   //check images or avatar
   //upload to cloudinary :avatar
   // Create user object - create entry to data base
   // remove password and refresh token
   // check for user creation
   // return response.

   const { fullname, username, email, password } = req.body;
   //Checks if any field is Empty.
   if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All Fields are necessary");
   }


   // checks if User is Already exsist or not.
   const exsistedUser = await User.findOne({ $or: [{ email }, { username }] });
   if (exsistedUser) {
      throw new ApiError(401, "User alredy Exsists");
   }

   // checks for Image and cover Image.
   const avatarLocalpath = req.files?.avatar[0]?.path;
   // const coverImageLocalpath = req.files?.coverImage[0].path;

   let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

   if (!avatarLocalpath) {
      throw new ApiError(400, "Avatar is required");
   }
   // Upload to cloudinary.

   const avatar = await uploadOnCloudinary(avatarLocalpath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if (!avatar) {
      throw new ApiError(400, "Avatar is required");
   }

   // upload to Database.

   const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   });

   // Check if user created.

   const createUser = await User.findById(user._id).select(
      "-password  -refreshToken"
   )
   if (!createUser) {
      throw new ApiError(500, "Something went wrong while creating User");
   }
   // console.log(createUser)
   //Return Responce.

   return res.status(201).json(
      new APiResponce(200), createUser, "user Created Succesfully");

});

const loginUser = asyncHandler(async (req, res) => {
   // 1.Get data or Req data form User from req.body.
   // 2.check if user exists.
   // 3. validate password.
   // 4. Generate Refresh and Access Token.
   // 5. send Cookies.

   // (1):
   const { email, username, password } = req.body;
 
   if (!(email || username)) {
      throw new ApiError(400, "email or username required");
   }

   // (2):
   const user = await User.findOne({ $or: [{ email }, { username }] });

   if (!user) {
      throw new ApiError(404, "User nor Registered");
   }
   const isPasswordVald = await user.isPasswordCorrect(password);

   if (!isPasswordVald) {
      throw new ApiError(401, "Password incorrect");
   }

   const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id);

   const logedInUser = await User.findById(user._id).select("-password -refreshToken");

   const options = {
      httpOnly: true,
      secure: true
   }
   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new APiResponce(
            200,
            {
               user: logedInUser, accessToken,refreshToken
            },
            " User Logged Succesfully "
         )
      )
})

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: {
            refreshToken: 1 //removes this field from document
         }
      },
      {
         new: true
      }
   )
   const options = {
      httpOnly: true,
      secure: true
   }
   res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
         new APiResponce(200,
            {},
            "user Logged out"
         )
      )

})

const refreshAccessToken = asyncHandler(async (req, res) => {

   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

   if (!incomingRefreshToken) {
      throw new ApiError(401, "Un authorized Request");
   }

   try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

      const user = await User.findById(decodedToken?._id);
      if (!user) {
         throw new ApiError(401, "Invalid Refresh-Token");
      }
      if (incomingRefreshToken != user?.refreshToken) {
         throw new ApiError(401, "Refresh-Token is Expired or used");
      }

      const options = {
         httpOnly: true,
         secure: true
      }
      const { accessToken, newRefreshToken } = await generateAccessandRefreshTokens(user._id);

      return res
         .status(200)
         .cookie("accessToken", accessToken,options)
         .cookie("refreshToken", newRefreshToken,options)
         .json(
            new APiResponce(
               200,
               {accessToken,refreshToken: newRefreshToken },
               "Access Token Refreshed"
            )
         )
   } catch (error) {
      throw new ApiError(402, error?.messege || "invalid Request");
   }

});

const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body;
   const user = await User.findById(req.user?._id);

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
   }

   user.password = newPassword;
   await user.save({ validateBeforeSave: false });

   return res
      .status(200)
      .json(new APiResponce(200, {}, "Password changed Succesfully"));

});

const getCurrentUser = asyncHandler(async (req, res) => {
   res
      .status(200)
      .json(new APiResponce(200, req.user, "Current user fetched succesfully"))
});

const updateAccountDetails = asyncHandler(async (req, res) => {
   const { fullname, email } = req.body;
   if (!fullname || !email) {
      throw new ApiError(400, "All Fields are Required");
   }

   const user = await User.findByIdAndUpdate(req.user?._id,
      {
         $set: {
            fullname: fullname,
            email: email
         }
      },
      { new: true }
   ).select("-password");

   return res
      .status(200)
      .json(new APiResponce(200, user, "account details updated"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {

   const avatarLocalPath = req.file?.path;
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file missing");
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if (!avatar) {
      throw new ApiError(400, "Error while uploading");
   }
   const user = await User.findByIdAndUpdate(req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      { new: true }
   ).select("-password");

   res
      .status(200)
      .json(new APiResponce(200, user, "Avatar uploaded succesfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {

   const coverImageocalPath = req.file?.path;
   if (!coverImageocalPath) {
      throw new ApiError(400, "Cover Image file missing");
   }
   const coverImage = await uploadOnCloudinary(coverImageocalPath);

   if (!coverImage) {
      throw new ApiError(400, "Error while uploading");
   }
   const user = await User.findByIdAndUpdate(req.user?._id,
      {
         $set: {
            avatar: coverImage.url
         }
      },
      { new: true }
   ).select("-password")


   res
      .status(200)
      .json(new APiResponce(200, user, "Cover Image uploaded succesfully"));

});

const getUserCurrentProfile = asyncHandler(async (req, res) => {
   const { username } = req.params;
   if (!username?.trim()) {
      throw new ApiError(400, "username is missing");
   }

   const channel = await User.aggregate([
      {
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
         $lookup: {
            from: "subcriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subcribers"
         }
      },
      {
         $lookup: {
            from: "subcriptions",
            localField: "_id",
            foreignField: "subcriber",
            as: "subcribedTo"
         }
      },
      {
         $addFields: {
            subscribersCount: {
               $size: "$subcribers"
            },
            channelsSubscribedToCount: {
               $size: "$subcribedTo"
            }
         },      
         isSubcribed: {
            $cond: {
               if: { $in: [req.user?._id, "$subcribers.subcriber"] },
               then: true,
               else: false
            }
         }
      },
      {
         $project: {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubcribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
         }
      }
   ]);

   if (!channel?.length) {
      throw new ApiError(404, "Channel does not exist");
   }
   return res
      .status(200)
      .json(new APiResponce(200, channel[0], "User channel fetched Succesfully"))

});


const getWatchHistory = asyncHandler(async (req, res) => {
   const user = await User.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
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
                  $addFields : {
                     owner :{
                        $first :"$owner"
                     }
                  }
               }

            ]
         }
      }
   ]);
   return res
   .status(200)
   .json(
      new APiResponce(200,user[0].watchHistory,"watch History fetched Succesfully")
   )
});



export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserCurrentProfile,
   getWatchHistory
}