const Course = require("../models/Course.js");
const Category = require("../models/Category.js");
const User = require("../models/User.js");
const uploadImageToCloudinary = require("../utils/imageUploader.js");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiResponse = require("../utils/ApiResponse.js");


exports.createCourse = async(req , res)=>{
    try {

        // fetch data 
        const {courseName , courseDescription , whatYouWillLearn , price , category} = req.body ;

        // get thumbnail
        const thumbnail = req.file.thumbnailImage ;
        
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail){
            throw new ApiError(404 , "All fields are required");
        }  

        // check for instructor 
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        console.log("Instructor details :- " , instructorDetails);

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
		await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					course: newCourse._id,
				},
			},
			{ new: true }
		);

        return res.status(200).json(
            new ApiResponse(200 , newCourse , "Course Created Successfully")
        )


    } catch (error) {
        throw new ApiError(400 , "Error while creating course");
    }
}


exports.showAllCourses = async(req, res) => {
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
