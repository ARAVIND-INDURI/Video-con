import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { APiResponce } from "../utils/apiResponce.js"
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
   // const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalpath = req.files?.coverImage[0].path;


   if (!avatarLocalpath) {
      throw new ApiError(400, "Avatar is required");
   }
   // Upload to cloudinary.

   const avatar = await uploadOnCloudinary(avatarLocalpath);
   const coverImage = await uploadOnCloudinary(coverImageLocalpath);
   if (!avatar) {
      throw new ApiError(400, "Avatar is required");
   }

   // upload to Database.

  const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage.url || "",
      email,
      password,
      username: username.toLowerCase()
   });

   // Check if user created.

   const createUser = await User.findById(user._id).select(
      "-password  -refreshToken"
   )
   if(!createUser){
      throw new ApiError(500 ,"Something went wrong while creating User");
   }
   // console.log(createUser)
   //Return Responce.
   
  return res.status(201).json(
   new APiResponce(200),createUser,"user Created Succesfully");

});


export { registerUser }