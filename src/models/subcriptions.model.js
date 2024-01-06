import mongoose, { Schema, Types } from "mongoose";

const SubcriptionSchema = new Schema({
    subcriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},
  {
    timestamps : true
  } 
);


export const Subcription = mongoose.model("Subcription", SubcriptionSchema);