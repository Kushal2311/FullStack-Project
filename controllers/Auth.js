const User = require("../models/User.js");
const OTP = require("../models/OTP.js");
const otpGenerator = require("otp-generator");
const ApiResponse = require("../utils/ApiResponse.js");
const ApiError = require("../utils/ApiError.js");
const Profile = require("../models/Profile.js")
// const asyncHandler = require("../utils/asyncHandler.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();


// Send OTP 
exports.sendOTP = async(req , res) => {

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
}



// SignUP

exports.SignUp = async(req , res) => {
    try {

        console.log("Signup Entry")
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
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
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
        return res.status(200)
        .json(
            new ApiResponse(201 , user , "User Registered Successfully")
        )
        
    } catch (error) {
        console.log("Love babbar")
        console.log(error)
        throw new ApiError(500 , "User Can't be registered , Plz try again");
    }

}


// LogIn
exports.LogIn = async(req , res) => {
    try {

        // get data from req body
        const {email , password} = req.body ;


        // validation data 
        if(!email || !password){
            throw new ApiError (403 , "All fields required");
        }


        // user check exist or not 
        const user = await User.findOne({email}).populate("additionalDetails")
        
        if(!user){
            throw new ApiError(401 , "User is not registered , plzz signup");
        }


        // generate jwt , after password matching 
        if(await bcrypt.compare(password , user.password)){
            const payload = {
                email : user.email ,
                id : user._id ,
                accountType : user.accountType ,
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET , {
                expiresIn:"2h",
            });
            user.token = token ,
            user.password = undefined ;

            const options = {
                expires : new Date(Date.now() + 3*24*60*60*1000) ,
                httpOnly : true ,
            }

            // create cookie and send response
            res.cookie("token" , token , options).status(200).json({
                success:true ,
                token ,
                user ,
                message : 'Logged in successfully' ,
            })

        }
        else {
            throw new ApiError(401 , "Password is incorrect");
        }
        



    } catch (error) {
        console.log(error);
        throw new ApiError(500 , "Log In failure Plzzz Try Again");
    }
}



// changePassword
// TODO
exports.changePassword = async(req , res) => {
    try {
        
        // get data from req body
        const userDetails = await User.findById(req.user.id);
        

        // get oldPass , newPass , confirmPasss ,
        const {oldPass , newPass , conPass} = req.body ;


        // Validation
        const isPasswordMatch = await bcrypt.compare(oldPass , userDetails.password);

        if(!isPasswordMatch){
            throw new ApiError(401 , "The Old Password is Incorrect")
        }

        if(newPass !== conPass){
            throw new ApiError(404 , "The password and confirm password does not match")
        }  

        // update password in DB
        const newencryptedPassword = await bcrypt.hash(newPass , 10);
        const updateUserDetails = await User.findByIdAndUpdate(
            req.user.id ,
            {password : newencryptedPassword} ,
            {new : true }
        );
        // send mail - password updated 
        try {
			const emailResponse = await mailSender(
				updateUserDetails.email,
				"Password updated",
				`Your account's password has been updated at ${Date.now()}`

				
			);
			console.log("Email sent successfully:", emailResponse.response);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			console.error("Error occurred while sending email:", error);
            throw new ApiError(500 , "Error occurred while sending email")
		}
        // send res
        return res.status(200).json(
            new ApiResponse(201 , "Password Updated successfully")
        )
    
    } catch (error) {
        throw new ApiError(500 , "Error occurred during changing password")
    }

}
