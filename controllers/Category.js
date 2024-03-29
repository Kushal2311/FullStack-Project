const Category = require("../models/Category.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");


// create Category ka handler function 
exports.createCategory = async(req, res)=> {
    try {
        // fetch data 
        const {name , description} = req.body ;

        // validation
        if(!name || !description){
            throw new ApiError(400 , "All fields are required");
        }

        // create entry in DB
        const categoryDetails = await Category.create({
            name : name ,
            description : description ,
        });
        
        // console.log(categoryDetails);

        return res.json(
            new ApiResponse(200 ,  categoryDetails , "Category Created successfully")
        )
        
    } catch (error) {
        throw new ApiError(500 , "error in creating Category function")
    }

}

exports.showAllCategory = async(req, res)=>{
    try {
        const allCategory = await Category.find({} , {name:true , description:true});
        return res.json(
            new ApiResponse(200 , allCategory , "All Category returned Successfully")
        )
    } catch (error) {
        throw new ApiError(500  , "error in showAllCategory");
    }
}

// categoryPageDetails 
exports.categoryPageDetails = async(req , res) => {
    try {

        const { categoryId } = req.body
        console.log("PRINTING CATEGORY ID: ", categoryId);
        // Get courses for the specified category
        const selectedCategory = await Category.findById(categoryId)
            .populate({
            path: "courses",
            match: { status: "Published" },
            populate: "ratingAndReviews",
            })
            .exec()

        if(!selectedCategory){
            throw new ApiError(400 , "data not found");
        }

        if(selectedCategory.course.length === 0){
            console.log("No courses found for the selected category.")
            throw new ApiError(404 , "data not found");
        }

        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
          })
        let differentCategory = await Category.findOne(categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id).populate({
              path: "courses",
              match: { status: "Published" },
            })
            .exec()
        
        // Get top-selling courses across all categories
        const allCategories = await Category.find()
        .populate({
            path: "courses",
            match: { status: "Published" },
            populate: {
                path: "instructor",
            },
        })
        .exec()
        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
        // console.log("mostSellingCourses COURSE", mostSellingCourses)
        return res.json(
            new ApiResponse(200 , mostSellingCourses , selectedCategory , differentCategory , "Category Page created Successfully")
        ) 

    } catch (error) {
        console.log(error);
        throw new ApiError(500  , "error in categoryPageDetails");    
    }
}