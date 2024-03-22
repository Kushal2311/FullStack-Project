const subSection = require("../models/SubSection.js");
const Section = require("../models/Section.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse");
const {uploadImageToCloudinary} = require("../utils/imageUploader.js");

// Create SubSection
exports.createSubSection = async(req , res) => {
    try {
        // fetch data from req body
        const {sectionId , title , timeduration , description} = req.body ;
        // extract file/videos
        const video = req.body.videoFile ;
        // validation
        if(!sectionId  || !title || !timeduration || !description){
            throw new ApiError(404 , "All Fields are required")
        }
        // upload videos on cloudinary 
        const uploadDetails = await uploadImageToCloudinary(video , process.env.FOLDER_NAME)
        // create a sub-section
        const subSectionDetails = await SubSection.create({
            title : title ,
            timeduration : timeduration ,
            description : description ,
            videoURL : uploadDetails.secure_url ,
        }) 
        // update section with this subsection objectId 
        const updatedSection = await Section.findByIdAndUpdate(
            {_id : sectionId} ,
            {$push : {
                subSection : subSectionDetails._id ,
            }},
            {new : true}
        ).populate("subSection")
        // return response 
        return res.status(200).json(
            new ApiResponse(200 , "Sub-Section Created Successfully")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while Creating sub-section")
    }
};