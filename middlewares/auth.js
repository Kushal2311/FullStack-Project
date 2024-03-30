const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User.js");
const ApiError = require("../utils/ApiError.js");

exports.auth = async(req, res , next) => {
    try {
        // Extract Token 
        const token = req.cookies.token || req.body.token || req.header("Authorisation").replace("Bearer " , "");
        
        //if tiken is missing then return response 
        if(!token){
            throw new ApiError(401 , "Token not found");
        } 

        // verify token 
        try {
            const decode = jwt.verify(token , process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode 
        } catch (error) {
            throw new ApiError(401 , "Token is invalid");
        }
        next();
    } catch (error) {
        throw new ApiError(401 , "Somthing went wrong while validating token") ;  
    }
};


// isStudent
exports.isStudent = async(req, res ,next) => {
    try {
        if(req.user.accountType !== "Student"){
            throw new ApiError(401 , "This is a protected route for students only");
        }
        next();
    } catch (error) {
        throw new ApiError(500 , "User role cannot be verified , try again");
    }     
};



// isInstructor
exports.isInstructor = async(req , res , next) => {
    try {
        if(req.user.accountType !== "Instructor"){
            throw new ApiError(401 , "This is a protected route for Instructor only");
        }
        next();
    } catch (error) {
        throw new ApiError(500 , "User role cannot be verified , try again");
    }  
};



//isAdmin 
exports.isAdmin = async(req , res , next) => {
    try {
        if(req.user.accountType !== "Admin"){
            throw new ApiError(401 , "This is a protected route for Admin only");
        }
        next();
    } catch (error) {
        throw new ApiError(500 , "User role cannot be verified , try again");
    }  
};