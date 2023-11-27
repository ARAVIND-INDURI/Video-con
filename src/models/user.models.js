import mangoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const UserSchema = new Schema({
   username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      index: true
   },
   email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
   },
   fullname: {
      type: String,
      required: true,
      trim: true,
      unique: true,
   },
   avatar: {
      type: String, //cloudnary link.
      required: true,
   },
   coverImage: {
      type: String,
   },
   watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "Video"
   },
   password: {
      type: String,
      required: [true, "password is required"],
   },
   refreshToken: {
      type: String,
   },
},
   {
      timestamps: true
   }
);

UserSchema.pre("save", async function (next) {
   if (!this.isModified("password")) return next();

   this.password = await bcrypt.hash("password", 9);
   next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateAccessToken = function () {
   return jwt.sign(
      {
         _id: this._id,
         username: this.username,
         email: this.email,
         fullname: this.fullname

      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn : process.env.ACCESS_TOKEN_EXPIRY
      }
   )
}

UserSchema.methods.generateRefreshToken = function () {
   return jwt.sign(
      {
         _id: this._id,

      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn : process.env.REFRESH_TOKEN_EXPIRY
      }
   )
}

export const User = mangoose.model("user", UserSchema);