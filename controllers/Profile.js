const Profile = require("../models/Profile.js");
const User = require("../models/User.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse");
const uploadImageToCloudinary = require("../utils/imageUploader.js");
require("dotenv").config();


exports.updateProfile = async(req , res) => {
    try {
        // get data 
        const {dateOfBirth = "" , about = "" , contactNumber , gender} = req.body ;

        // get userId
        const id = req.user.id ;

        // validation
        if(!contactNumber || !gender || !id){
          throw new ApiError(404,"All Fields are required");
        }

        // find profile
        const userDetails = await User.findById(id);
        if (!userDetails) {
          throw new ApiError(404, "User not found");
        }

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
        );
        
    } catch (error) {
        console.log(error);
        throw new ApiError(404,"Error while Updating Profile");
    }
};


// To explore -> how can we schedule this deletion operation 
exports.deleteAccount = async (req , res) => {
    try {
        // get id 
        const id = req.user.id ;
        console.log(id);
        const user = await User.findById({_id : id});

        // validation 
        if(!user){
            throw new ApiError(404 , "User not found")
        }

        // delete profile 
        await Profile.findByIdAndDelete({_id : user.additionalDetails});

        // TODO : HW - unenroll user form all enrolled courses 

        // delete user 
        await User.findByIdAndDelete({_id : id});

        // return response 
        return res.status(200).json(
            new ApiResponse(200 , "Profile Deleted Successfully")
        )
        
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while deleting Profile");
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


exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id

      const userDetails = await User.findById(userId);
      const profileId = userDetails.additionalDetails;
      const profileDetails = await Profile.findById(profileId); // Define profileDetails

      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      return res.status(200).json(
        new ApiResponse(200 , profileDetails , "Image Updated successfully")
    )
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while updateDisplayPicture")
    }
  }
  
  exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      let userDetails = await User.findOne({
        _id: userId,
      })
        .populate({
          path: "courses",
          populate: {
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          },
        })
        .exec()
      userDetails = userDetails.toObject()
      var SubsectionLength = 0
      for (var i = 0; i < userDetails.courses.length; i++) {
        let totalDurationInSeconds = 0
        SubsectionLength = 0
        for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
          totalDurationInSeconds += userDetails.courses[i].courseContent[
            j
          ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
          userDetails.courses[i].totalDuration = convertSecondsToDuration(
            totalDurationInSeconds
          )
          SubsectionLength +=
            userDetails.courses[i].courseContent[j].subSection.length
        }
        let courseProgressCount = await CourseProgress.findOne({
          courseID: userDetails.courses[i]._id,
          userId: userId,
        })
        courseProgressCount = courseProgressCount?.completedVideos.length
        if (SubsectionLength === 0) {
          userDetails.courses[i].progressPercentage = 100
        } else {
          // To make it up to 2 decimal point
          const multiplier = Math.pow(10, 2)
          userDetails.courses[i].progressPercentage =
            Math.round(
              (courseProgressCount / SubsectionLength) * 100 * multiplier
            ) / multiplier
        }
      }
  
      if (!userDetails) {
        throw new ApiError(404 , `Could not find user with id: ${userDetails}`)
      }
      return res.status(200).json(
        new ApiResponse(200 , userDetails , "getenrolledcourse successfully")
    )
    } catch (error) {
      console.log(error);
      throw new ApiError(404 , "Error while fetching get all enrolled course")
    }
  }
  
  exports.instructorDashboard = async (req, res) => {
    try {
      const courseDetails = await Course.find({ instructor: req.user.id })
  
      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course.studentsEnroled.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price
  
        // Create a new object with the additional fields
        const courseDataWithStats = {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          // Include other course properties as needed
          totalStudentsEnrolled,
          totalAmountGenerated,
        }
  
        return courseDataWithStats
      })
  
      return res.status(200).json(
        new ApiResponse(200 , courseData , "instructor dashboard successfully")
    )
    } catch (error) {
      console.error(error)
      throw new ApiError(404 , "Server Error")
    }
  }

