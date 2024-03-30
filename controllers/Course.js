const Course = require("../models/Course.js");
const Category = require("../models/Category.js");
const User = require("../models/User.js");
const uploadImageToCloudinary = require("../utils/imageUploader.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
require("dotenv").config();

exports.createCourse = async(req , res)=>{
    try {

        // Get user ID from request object
        const userId = req.user.id

        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag: _tag,
            category,
            status,
            instructions: _instructions,
          } = req.body

        // get thumbnail
        const thumbnail = req.files.thumbnailImage ;
        console.log(thumbnail);
        
        const tag = _tag ? JSON.parse(_tag) : [];
        const instructions = _instructions ? JSON.parse(_instructions) : [];

        console.log("tag", tag)
        console.log("instructions", instructions)

        if (
            !courseName ||
            !courseDescription ||
            !whatYouWillLearn ||
            !price ||
            !tag.length ||
            !thumbnail ||
            !category ||
            !instructions.length
          ){
            throw new ApiError(404 , "All fields are required");
        }  

        if (!status || status === undefined) {
            status = "Draft"
        }

        // check for instructor 
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor",
        })

        if(!instructorDetails){
            throw new ApiError(404 , "Instructor Details Not Found");
        }

        // check given Category is Valid or not 
        const categoryDetails = await Category.findById(category);
		if (!categoryDetails) {
			throw new ApiError(404 , "Category Details Not found")
		}

        // upload Image to cloudinary 
        const thumbnailImage = await uploadImageToCloudinary(thumbnail , process.env.FOLDER_NAME);

        // create entry for new COurse 
        const newCourse = await Course.create({
            courseName ,
            courseDescription ,
            instructor : instructorDetails._id ,
            whatYouWillLearn ,
            price ,
            category : categoryDetails._id,
            thumbnail : thumbnailImage.secure_url ,
        })

        // add new Course to the user Schema of Instructor 
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id} ,
            {
                $push : {
                    courses : newCourse._id ,
                }
            },
            {new : true},
        );

        // 

        // Add the new course to the Categories
		// Add the new course to the Categories
		const categoryDetails2 =  await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					course: newCourse._id,
				},
			},
			{ new: true }
		)
        
        console.log("HEREEEEEEEE", categoryDetails2);

        return res.status(200).json(
            new ApiResponse(200 , newCourse , "Course Created Successfully")
        )


    } catch (error) {
        console.log("kushal found error");
        console.log(error);
        throw new ApiError(400 , "Error while creating course");
    }
}


exports.getAllCourses = async(req, res) => {
    try {
        
        const allCourses = await Course.find({} , {
            courseName : true ,
            price : true ,
            thumbnail : true ,
            instructor : true ,
            ratingAndReview : true ,
            studentsEnrolled : true ,
        })
        .populate("instructor")
        .exec();

        return res.status(200).json(
            new ApiResponse(200 , allCourses , "data for all courses fetched successfully")
        )

    } catch (error) {
        throw new ApiError(500 , "Cannot fetch course data");

    }
}


exports.getCourseDetails = async(req , res) => {
    try {
        
        // get id 
        const {courseId} = req.body ;

        // find course details 
        const courseDetails = await Course.find(
            {_id : courseId})
            .populate(
                {
                    path : "instructor" ,
                    populate : {
                        path : "additionalDetails" ,
                    },
                }
            )
            .populate("category")
            // .populate("ratingAndReviews")
            .populate({
                path : "courseContent" ,
                populate : {
                    path : "subSection" ,
                },
            })
            .exec();

    if(!courseDetails){
        throw new ApiError(404 , "Course Details Not found")
    }

    return res.status(200).json(
        new ApiResponse(200 , courseDetails , "Course Details fetched successfully")
    )

    } catch (error) {
        console.log(error);
        throw new ApiError(500 , "Cannot fetch course details");
    }
}
