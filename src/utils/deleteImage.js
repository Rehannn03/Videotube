import {v2 as cloudinary} from 'cloudinary';
import { asyncHandler } from './asyncHandler.js';


const deleteImage= asyncHandler( async (publicId)=>{
    try {
        const response=await cloudinary.uploader.destroy(publicId,{resource_type:'image'}).then(result=>console.log(result))
        return response
    } catch (err) {
        return null
    }
})

export default deleteImage