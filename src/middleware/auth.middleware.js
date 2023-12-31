import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"

export const verifyJWT=asyncHandler(async(req,_,next)=>{

    try {
        
        const token=req.cookies?.accessToken || req.header("Authorization").replace("Bearer ","")
        
        if(!token){
            throw new ApiError(401,"Unauthorized access")
        }
    
        const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        
        const user=await User.findById(decoded?._id).select("-password -refreshToken")
        
        req.user=user
        next()
    } catch (error) {
        // throw new ApiError(401,"Invalid token")
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})