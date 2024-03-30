const User = require("../models/User.js");
const mailSender = require("../utils/mailSender.js");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiResponse = require("../utils/ApiResponse.js");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


// restSetPasswordToken 
exports.resetPasswordToken = async(req, res) => {
    //  get email from req body 
    const email = req.body.email ;

    // check user for this email , email validation
    const user = await User.findOne({email : email});
    if(!user){
        throw new ApiError(401 , "User Not found with such email id");
    }
    // generate token 
    const token = crypto.randomUUID();
    // update user by adding token and expiration time 
    const updatedDetails = await User.findOneAndUpdate(
                                                    {email:email} , 
                                                    {
                                                        token : token ,
                                                        resetPasswordExpires : Date.now() + 5*60*1000 ,
                                                    },
                                                    {
                                                        new : true 
                                                    } )
    
    // create url 
    const url = `http://localhost:3000/update-password/${token}`;

    // send mail containing url 
    await mailSender(email , "Password Reset Link" , `Password Reset Link : ${url}`);

    // return res 
    return res.json(
        new ApiResponse(200 , "Email sent successfully plz check email")
    )
}


// Reset Password 
exports.resetPassword = async(req , res) =>{
    // data fetch 
    const {token , password , confirmPassword } = req.body ;
    // validation
    if(password !== confirmPassword){
        throw new ApiError(404 , "Password not matching")
    }
    // get userdetails from db using token
    const userDetails = await User.findOne({token : token})
    // token time check 
    if(!userDetails){
        throw new ApiError(401 , "Token is invalid")
    }
    if( userDetails.resetPasswordExpires < Date.now() ){
        throw new ApiError(401 , "Token time validite expires")
    }
    
    // password hash
    const hashedPassword = await bcrypt.hash(password , 10);
    
    // update password 
    const user = await User.findOneAndUpdate({token : token} , {password : hashedPassword} , {new:true});
    // return response 
    return res.json(
        new ApiResponse(200 , user , "Password rest successfully and updated in db")
    )

}