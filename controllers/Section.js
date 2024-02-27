const Section = require("../models/Section.js");
const Course = require("../models/Course.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse");


exports.createSection = async(req , res) => {
    try {
        // data fetch 
        const {sectionName , courseId } = req.body ;
        
        
        // data validation
        if(!sectionName || !courseId){
            throw new ApiError(401 , "all fields are required")
        }
        
        
        // create section
        const newSection = await Section.create({sectionName});


        // update course with section ObjectId
        const updateCoursedetails = await Course.findByIdAndUpdate(
            courseId ,
            {
                $push : {
                    courseContent : newSection._id ,
                }
            },
            {
                new : true 
            },
        )
        .populate({
            path : "courseContent" ,
            populate : {
                path : "subSection" ,
            },
        })
        .exec();


        // return response 
        return res.status(200).json(
            new ApiResponse(200 , "Section Created Successfully")
        )
        
    } catch (error) {
        throw new ApiError(404 , "Error while Creating section")
    }
}



// update section 
exports.updateSection = async(req , res) => {
    try {
        const { sectionName, sectionId } = req.body;
		const section = await Section.findByIdAndUpdate(
			sectionId,
			{ sectionName },
			{ new: true }
		);

        return res.status(200).json(
            new ApiResponse(200 , section ,"Section updated successfully")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(44 , "Error while updating Section")
    }
}