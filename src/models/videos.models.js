import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const VideoSchema = new Schema(
    {
         videoFile:{
            type:String,
            required:true
         },
         Thumbnail:{
            type:String,
            required:true
         },
         Title:{
            type:String,
            required:true
         },
         Description:{
            type:String,
            required:true
         },
         Duration:{
            type:Number,
         },
         views:{
             type:Number,
             default :0
         },
         Ispublished:{
            type :Boolean,
            default:true
         },
         owner:{
            type:Schema.Types.ObjectId,
            ref :"user"
         }



    },
    {
        timestamps: true
    }

);

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("video", VideoSchema); 