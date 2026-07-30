import mongoose from "mongoose";
import { MONGODB_URI } from "../constants.js";

const connectToDatabase = async () => {
    try {
        const connectionInstance = await mongoose.connect(MONGODB_URI);
        console.log(`✅ MongoDB connected successfully`);
        // console.log(connectionInstance);
    } catch (error) {
        console.error(`❎ MongoDB connection error: ${error}`);
        process.exit(1);
    }
};

export default connectToDatabase;
