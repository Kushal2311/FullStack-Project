const Tag = require("../models/Tags.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler.js");


// create tag ka handler function 
exports.createTag = asyncHandler(async(req, res)=> {
    try {
        // fetch data 
        const {name , description} = req.body ;

        // validation
        if(!name || !description){
            throw new ApiError(400 , "All fields are required");
        }

        // create entry in DB
        const tagDetails = await Tag.create({
            name : name ,
            description : description ,
        });
        
        // console.log(tagDetails);

        return res.json(
            new ApiResponse(200 ,  tagDetails , "Tag Created successfully")
        )
        
    } catch (error) {
        throw new ApiError(500 , "error in creating tag function")
    }

})

exports.showAlltags = asyncHandler(async(req, res)=>{
    try {
        const allTags = await Tag.find({} , {name:true , description:true});
        return res.json(
            new ApiResponse(200 , allTags , "All tags returned Successfully")
        )
    } catch (error) {
        throw new ApiError(500  , "error in showAllTags");
    }
})