import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
const registerUser = asyncHandler( async(req,res) =>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    // console.log('email: ',email)
    if (fullName==="") {
        throw new ApiError(400,'Please Enter Full name')
    }
    else if(email===""){
        throw new ApiError(400,'Please enter email')
    }
    else if(username===""){
        throw new ApiError(400,'Please enter username')
    }
    else if(password===""){
        throw new ApiError(400,'Please enter password')
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    
    
    if(existedUser){
        throw new ApiError(409,'User already Exists')
    }
    // console.log(req.files)
    const avatarPath=req.files?.avatar[0]?.path
    
    // const coverImagePath=req.files?.coverImage[0]?.path
    let coverImagePath;

    // if(Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    //     coverImagePath=req.files.coverImage[0].path
    // }
   
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path
         
    }

    if(!avatarPath){
        throw new ApiError(400,'avatar file required')
    }

    const avatar= await uploadOnCloudinary(avatarPath)
    const coverImage= await uploadOnCloudinary(coverImagePath)


    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the User")
    }

    return res.status(200).json(
        new ApiResponse(201,user,"User successfully created")
    )
} )

const generateRefreshTokenAndAccessToken= async(userID) => {
    try {
        const user=await User.findOne(userID)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return {refreshToken,accessToken}

    } catch (error) {
        throw new ApiError(500,"Cannot generate refresh and access token")
        
    }

    
}

const loginUser=asyncHandler(async(req,res)=>{
    //Input username and Password
    //Validate from database if present or not
    //Give refresh token
    //Give authorization token
    //Send both using cookies
    
    const {username,password}=req.body
    // console.log(req.body)
    const user= await User.findOne({username})
    if(!user){
        throw new ApiError(500,"User does not exist")
    }

    const checkPassword= await user.isPasswordCorrect(password)

    if(!checkPassword){
        throw new ApiError(401,"Incorrect Password")
    }

    const {accessToken,refreshToken}=await generateRefreshTokenAndAccessToken(user._id)
    
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(
            200,
            {
                user:accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            return:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(
        new ApiResponse(
            201,
            {},
            'User logged out successfully'
        )
    )
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const userRefreshToken=req.cookies?.refreshToken || req.body.refreshToken
    if(!userRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    const decoded=jwt.verify(userRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user= await User.findById(decoded?._id).select("-password ")

    if(!user){
        throw new ApiError(401,"User does not exist")
    }

    if(user.refreshToken !== userRefreshToken){
        throw new ApiError(401, "Invalid user")
    }

    const {accessToken,refreshToken}=await generateRefreshTokenAndAccessToken(user._id)

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(201,
            {
                accessToken,refreshToken
            },
            "Access Token refreshed")
    )
})

export {registerUser,loginUser,logoutUser,refreshAccessToken}