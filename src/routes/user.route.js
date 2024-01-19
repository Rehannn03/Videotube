import {loginUser, logoutUser, refreshAccessToken, registerUser,changePassword, updateAccountDetails,updateUserAvatar, updateUserCoverImage} from "../controllers/user.controller.js";
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
router.route('/update-avatar').post(verifyJWT,upload.single('avatar'),updateUserAvatar)
router.route('/update-coverimage').post(verifyJWT,upload.single('coverImage'),updateUserCoverImage)
export default router