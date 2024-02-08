import {loginUser, logoutUser, refreshAccessToken, registerUser,changePassword, updateAccountDetails,updateUserAvatar, updateUserCoverImage, getUserChannelProfile} from "../controllers/user.controller.js";
import { subscribeTo } from "../controllers/subscriber.controller.js";
import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router=Router()

router.route('/register').post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ])
    ,registerUser)

router.route('/login').post(loginUser) 
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT,changePassword)
router.route('/update-profile').post(verifyJWT,updateAccountDetails)
router.route('/update-avatar').patch(verifyJWT,upload.single('avatar'),updateUserAvatar)
router.route('/update-coverimage').patch(verifyJWT,upload.single('coverImage'),updateUserCoverImage)
router.route('/channel/:username').get(getUserChannelProfile)
router.route('/channel/:channelId/subscribe').post(verifyJWT,subscribeTo)
export default router