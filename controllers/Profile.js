const Profile = require("../models/Profile.js");
const User = require("../models/User.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse");


exports.updateProfile = async(req , res) => {
    try {
        // get data 
        const {dateOfBirth = "" , about = "" , contactNumber , gender} = req.body ;

        // get userId
        const id = req.user.id ;

        // validation
        if(!contactNumber || !gender || !id){
            throw new ApiError(404 , "All Fields are required")
        }

        // find profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails ;
        const profileDetails = await Profile.findById(profileId);

        // update profile 
        profileDetails.dateOfBirth = dateOfBirth ;
        profileDetails.about = about ;
        profileDetails.gender = gender ;
        profileDetails.contactNumber = contactNumber ;
        await profileDetails.save();

        // return response 
        return res.status(200).json(
            new ApiResponse(200 , profileDetails , "Profile Updated Successfully")
        )
        
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while Updating Profile")
    }
};


// To explore -> how can we schedule this deletion operation 
exports.deleteAccount = async (req , res) => {
    try {
        // get id 
        const id = req.user.id ;
        const userDetails = await User.findById(id);

        // validation 
        if(!userDetails){
            throw new ApiError(404 , "User not found")
        }

        // delete profile 
        await Profile.findByIdAndDelete({_id : userDetails.additionalDetails});

        // TODO : HW - unenroll user form all enrolled courses 

        // delete user 
        await User.findByIdAndDelete({_id : id});

        // return response 
        return res.status(200).json(
            new ApiResponse(200 , profileDetails , "Profile Deleted Successfully")
        )
        
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while deleting Profile")
    }
};


exports.getUserAllDetails = async(req, res) => {
    try {
        // get id 
        const id = req.user.id ;

        // call db and get all detail 
        const userDetail = await User.findById(id).populate("additionalDetails").exec();
        
        return res.status(200).json(
            new ApiResponse(200 , userDetail , "User Detail Shared Successfully")
        )
        
    } catch (error) {
        console.log(error)
        throw new ApiError(404 , "Error while getting user all details")
    }
}