const User = require("../models/User.js");
const OTP = require("../models/OTP.js");
const otpGenerator = require("otp-generator");
const ApiResponse = require("../utils/ApiResponse.js");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");
const bcrypt = require("bcrypt");


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

const SignUp = asyncHandler(async(req , res) => {
    try {

        // Data Fetch From req ki body
        const {
            firstName ,
            lastName ,
            email ,
            password ,
            confirmPassword ,
            accountType ,
            contactNumber ,
            otp
        } = req.body ;
    
    
        // Validate Karo
        if(!firstName || !lastName || !email || !password || confirmPassword || !otp){
            throw new ApiError(403 , "All Fields are required");
        }
    
    
        // 2 Password match karlo 
        if(password !== confirmPassword){
            throw new ApiError(400 , "Password and ConfirmPassword value does not match , please try again");
        }
    
    
        // check user already exist or not 
        const existingUser = await User.findOne({email});
        if(existingUser){
            throw new ApiError(400 , "User Already Exist");
        }
    
    
        // find most recent OTP stored for the user 
        const recentOTP = await OTP.findOne({email}).sort({createdAt : -1}).limit(1);
        console.log(recentOTP);
    
    
        // validate otp 
        if(!recentOTP){
            throw new ApiError(400 , "No OTP found");
        }else if (otp !== recentOTP.otp){
            throw new ApiError(401 , "Invalide OTP");
        }
    
    
        // hash password 
        const hashedPassword = await bcrypt.hash(password , 10);
    
    
        // entry created in db
        const profileDetails = await Profile.create({
            gender : null ,
            dateOfBirth : null ,
            about : null ,
            contactNumber : null ,
        });
    
    
        const user = await User.create({
            firstName ,
            lastName ,
            email ,
            contactNumber ,
            password : hashedPassword ,
            accountType ,
            additionalDetails : profileDetails._id ,
            image : `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })
    
    
        // return res 
        return res
        .status(200)
        .json(
            new ApiResponse(201 , user , "User Registered Successfully")
        )
        
    } catch (error) {
        throw new ApiError(500 , "User Can't be registered , Plz try again");
    }

})


// LogIn
const LogIn = asyncHandler( async(req , res) => {
    
})



// changePassword



export {
    sendOTP ,
    SignUp ,

}