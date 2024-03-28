const RatingAndReview = require("../models/RatingAndReview.js");
const Course = require("../models/Course.js");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiResponse = require("../utils/ApiResponse.js");


// createRating 
exports.createRating = async(req , res) => {
    try {
        // get user id 
        const userId = req.user.id ;

        // fetch data from req body 
        const{review , rating , courseId} = req.body ;

        // check if user is enrolled or not
        const courseDetails = await Course.findOne({
            _id : courseId ,
            studentsEnrolled : {$elemMatch : {$eq : userId}},
        });

        if(!courseDetails){
            throw new ApiError(404 , "Student is not enrolled in the course");
        }

        // check if user is already reviewed the course 
        const alreadyReviewed = await RatingAndReview.findOne({
            _id : userId ,
            course : courseId ,
        }) ;
        if(alreadyReviewed){
            throw new ApiError(403 , "User Already Reviewed the course");
        }

        // create rating and review 
        const ratingReview = await RatingAndReview.create({
            rating , review , course : courseId , user : userId ,
        });


        // update course with this rating&reviews
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            {_id : courseId} ,
            {
                $push : {
                    ratingAndReviews:ratingReview._id,
                }
            },
            {new : true},
        );
        console.log(updatedCourseDetails);
        
        // return response 
        return res.status(200).json(
            new ApiResponse(200 , ratingReview , "Rating and Review created Successfully")
        )
        
    } catch (error) {
        console.log(error);
        throw new ApiError(400 , "Error while creating review");
    }
};


// average Rating 
exports.getAverageRating = async(req , res) => {
    try {
        // get courseid 
        const courseId = req.body.courseId ;

        // calculate avg rating 
        const result = await RatingAndReview.aggregate([
            {
                $match : {
                    course : new mongoose.Types.ObjectId(courseId) ,
                },
            },
            {
                $group : {
                    _id : null ,
                    averageRating : {$avg : "$rating"},
                }
            }
        ]) 

        if(result.length > 0){
            return res.status(200).json(
                new ApiResponse(200 , result[0].averageRating , "avg Rating created successfully")
            )
        } 
        // return rating 
        return res.status(200).json(
            new ApiResponse(200 ,   "Avg rating is 0  , no rating given till now ")
        )

    } catch (error) {
        console.log(error);
        throw new ApiError(400 , "Error while averaging review");
    }
};

// getallratingandreview 
exports.getAllRating = async(req , res) => {
    try {
        
        const allReview = await RatingAndReview.find({})
                                .sort({rating : "desc"})
                                .populate({
                                    path : "user" ,
                                    select : "firstName lastName email image",
                                })
                                .populate({
                                    path : "course" ,
                                    select : "courseName",
                                })
                                .exec();

        return res.status(200).json(
            new ApiResponse(200 ,  allReview , "fetched all reviews")
        )

    } catch (error) {
        console.log(error);
        throw new ApiError(400 , "Error while fetching all reviews");
    }
}
