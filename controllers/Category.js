const Category = require("../models/Category.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");


// create Category ka handler function 
exports.createCategory = asyncHandler(async(req, res)=> {
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

})

exports.showAllCategory = asyncHandler(async(req, res)=>{
    try {
        const allCategory = await Category.find({} , {name:true , description:true});
        return res.json(
            new ApiResponse(200 , allCategory , "All Category returned Successfully")
        )
    } catch (error) {
        throw new ApiError(500  , "error in showAllCategory");
    }
})