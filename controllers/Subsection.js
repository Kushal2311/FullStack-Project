const SubSection = require("../models/SubSection.js");
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
            new ApiResponse(200 , updatedSection , "Sub-Section Created Successfully")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while Creating sub-section")
    }
};

exports.updateSubSection = async(req , res) => {
    try {
        const {sectionId , title , description} = req.body ;

        const SubSection = await SubSection.findById(sectionId);

        if(!SubSection){
            throw new ApiError(404 , "All Fields are required")
        }

        if(title !== undefined){
            SubSection.title = title 
        }

        if(description !== undefined){
            SubSection.description = description
        }

        if(req.files && req.files.video !== undefined){
            const video = req.files.video 
            const uploadDetails = await uploadImageToCloudinary(
                video , 
                process.env.FOLDER_NAME 
            )
            SubSection.videoURL = uploadDetails.secure_url 
            SubSection.timeduration = `${uploadDetails.duration}`
        }

        await SubSection.save()
        
        return res.status(200).json(
            new ApiResponse(200 , SubSection ,"Sub-Section updated successfully")
        )
        
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while Updating sub-section")
    }
};


exports.deleteSubSection = async(req , res) => {
    try {
        const {subSectionID , sectionId } = req.body ;
        await Section.findByIdAndUpdate(
            {_id : sectionId} ,
            {
                $pull : {
                    subSection : subSectionID 
                },
            }
        )

        const subSection = await SubSection.findByIdAndDelete({_id : subSectionID})

        if(!subSection){
            throw new ApiError(404 , "Sub-Section Not Found")
        }

        return res.status(200).json(
            new ApiResponse(200 , SubSection ,"Sub-Section deleted successfully")
        )
        
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while deleting sub-section")
    }
}

