import mongoose from "mongoose";

import {DB_NAME} from "../constants.js";

const connectDB = async () => {
    try {
       const ConnectInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(` \n MongoDB Connected DB Host !!1:${ConnectInstance.connection.host}`);

    } catch (error) {
        console.log(`Error in proccesing`,error);
        process.exit(1);
    }
}

export default connectDB;