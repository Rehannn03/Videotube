import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async ()=>{
    try {
        const response=await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        console.log("Connection Successsful!!!: ",response.connection.host)
    } catch (error) {
        console.log("MongoDB connection Failed: ",error)
        
    }
}

export default connectDB