const User = require("../models/User.js");
const OTP = require("../models/OTP.js");
const otpGenerator = require("otp-generator");
const ApiResponse = require("../utils/ApiResponse.js");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");


// Send OTP 
const sendOTP = asyncHandler( async(req , res) => {

    try {
        // Fetch email from user body 
        const {email} = req.body ;
    
        // check if user already exist 
        const checkUserPresent = await User.findOne({email});
    
        if(checkUserPresent){
            return res.status(401).json({
                success : false ,
                message : "User already exist" ,
            })
        }

        // generate OTP
        var otp = otpGenerator.generate(5 , {
            upperCaseAlphabets:false ,
            lowerCaseAlphabets:false ,
            specialChars:false ,
        }) 
        console.log("OTP Genratred - " , otp);

        // check unique otp or not 
        const result = await OTP.findOne({otp:otp});

        while(result){
            otp = otpGenerator.generate(5 , {
                upperCaseAlphabets:false ,
                lowerCaseAlphabets:false ,
                specialChars:false ,
            }) 

            result = await OTP.findOne({otp:otp});
        }

        const otpPayload = {email , otp}; 

        // create an entry for otp 
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        return res.status(200).json(
            new ApiResponse(200 , otp , "OTP Sent Successfully")
        )


    } catch (error) {
        throw new ApiError(500 , "Error in OTP sending"); 
        
    }
})



// SignUP

// LogIn

// changePassword



export {
    sendOTP ,
    
}