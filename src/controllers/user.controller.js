import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import deleteImage from "../utils/deleteImage.js";
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  // console.log('email: ',email)
  if (fullName === "") {
    throw new ApiError(400, "Please Enter Full name");
  } else if (email === "") {
    throw new ApiError(400, "Please enter email");
  } else if (username === "") {
    throw new ApiError(400, "Please enter username");
  } else if (password === "") {
    throw new ApiError(400, "Please enter password");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already Exists");
  }
  // console.log(req.files)
  const avatarPath = req.files?.avatar[0]?.path;

  // const coverImagePath=req.files?.coverImage[0]?.path
  let coverImagePath;

  // if(Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
  //     coverImagePath=req.files.coverImage[0].path
  // }

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }

  if (!avatarPath) {
    throw new ApiError(400, "avatar file required");
  }

  const avatar = await uploadOnCloudinary(avatarPath);
  const coverImage = await uploadOnCloudinary(coverImagePath);

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the User");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, user, "User successfully created"));
});

const generateRefreshTokenAndAccessToken = async (userID) => {
  try {
    const user = await User.findOne(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, "Cannot generate refresh and access token");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //Input username and Password
  //Validate from database if present or not
  //Give refresh token
  //Give authorization token
  //Send both using cookies

  const { username, password } = req.body;
  // console.log(req.body)
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(500, "User does not exist");
  }

  const checkPassword = await user.isPasswordCorrect(password);

  if (!checkPassword) {
    throw new ApiError(401, "Incorrect Password");
  }

  const { accessToken, refreshToken } =
    await generateRefreshTokenAndAccessToken(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      return: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(201, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const userRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!userRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decoded = jwt.verify(
    userRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decoded?._id).select("-password ");

  if (!user) {
    throw new ApiError(401, "User does not exist");
  }

  if (user.refreshToken !== userRefreshToken) {
    throw new ApiError(401, "Invalid user");
  }

  const { accessToken, refreshToken } =
    await generateRefreshTokenAndAccessToken(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        {
          accessToken,
          refreshToken,
        },
        "Access Token refreshed"
      )
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const checkPassword = await user.isPasswordCorrect(currentPassword);

  if (!checkPassword) {
    throw new ApiError(401, "Incorrect Password");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
        200,
        req.user,
        "User details fetched successfully"
    )
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName,email,username}=req.body
    const user=await User.findByIdAndUpdate(req.user._id,{
        fullName,
        email,
        username
    },{new:true}).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User details updated successfully"
        )
    )
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarPath=req.file.path
    const avatarURL=req.user.avatar
    const avatarPublicId=avatarURL.split("/")[avatarURL.split("/").length-1].split(".")[0]
    const deleteImage=await deleteImage(avatarPublicId)
    if(!avatarPath){
        throw new ApiError(400,"avatar file required")
    }
    // console.log(avatar.public_id)
    const avatar=await uploadOnCloudinary(avatarPath)   
    // const deletedImage=deleteImage(avatar.public_id) 
    const user=await User.findByIdAndUpdate(req.user._id,{
        avatar:avatar.url
    },{new:true}).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User avatar updated successfully"
        )
    )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImagePath=req.file.path
    
    if(!coverImagePath){
        throw new ApiError(400,"cover image required")
    }

    const coverImage=await uploadOnCloudinary(coverImagePath)
    deleteImage(coverImage.public_id)
    const user=await User.findByIdAndUpdate(req.user._id,{
        coverImage:coverImage.url
    },{new:true}).select("-password -refreshToken")

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User avatar updated successfully"
        )
    )
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
  const {username}= req.params

  if(!username){
    throw new ApiError(400,"User does not exist")
  }

  const channel=await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
            $size:"$subscribers"
        },
        subscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            $if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      channel,
      "Channel details fetched successfully"
    )
  
  )
});


export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changePassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage,
    getUserChannelProfile }; 
