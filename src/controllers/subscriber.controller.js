import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.model.js";

const subscribeTo=asyncHandler(async(req,res)=>{
    const {channelId} =req.params
    
    const channel =await User.findById(channelId)

    if(!channel){
        throw new ApiError(404,"Channel not found")
    }

    const isSubscribed=await Subscription.find({subscriber:req.user._id})
    
    if(isSubscribed && isSubscribed.length>0){
        const unsubscribed=await Subscription.findOneAndDelete(isSubscribed._id)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    unsubscribed
                
                },
                "Unsubscribed successfully"
            )
        )
    }   
    const subscriber=await Subscription.create({
        subscriber:req.user._id,
        channel:channelId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                subscriber
            }
        )
    )
})


export {
    subscribeTo
}