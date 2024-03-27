const instance = require("../config/razorpay.js");
const Course = require("../models/Course.js");
const User = require("../models/User.js");
const mailSender = require("../utils/mailSender.js");
const courseEnrollmentEmail = require("../mail/templates/courseEnrollmentEmail.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse");


// capture the payment and initiate the Razorpay order 
exports.capturePayment = async(req , res) => {
    // get courseid and userid 
    const course_id = req.body ;
    const userId = req.user.id ;

    // validation 
    if(!course_id){
        throw new ApiError(404 , "plz provide valid course id")
    }

    // valid course details 
    let course ;
    try {
        course = await Course.findById(course_id);
        if(!course){
            throw new ApiError(404 , "could not find the course")
        }

        // user already pay for the same course 
        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentsEnrolled.includes(uid)){
            throw new ApiError(404 , "student is already enrolled")
        }

    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while accessing course details")
    }

    // create order 
    const amount = course.price ;
    const currency = "INR" ;

    const options = {
        amount : amount * 100 ,
        currency : currency ,
        receipt : Math.random(Date.now()).toString() ,
        notes : {
            course_id : course_id ,
            userId ,
        }
    };

    try {
        // initiate the payment 
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        return res.json(
            new ApiResponse(200 , paymentResponse , "Payment created successfully")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(404 , "Error while creating payment ")
    }

};


// verify signature of razorpay and server 

exports.verifySignature = async(req , res) => {
    const webhookSecret = "12345678" ;
    const signature = req.headers["x-razorpay-signature"];
    
    const shasum = crypto.createHmac("sha256" , webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if(signature === digest){
        console.log("Payment is authorised");

        const {courseId , userId} = req.body.payload.payment.entity.notes ;
        try {
            
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id : courseId} ,
                {$push : {studentsEnrolled:userId}} ,
                {new : true},
            );

            if(!enrolledCourse){
                throw new ApiError(404 , "Course Not Found")
            }

            console.log(enrolledCourse);
            const enrolledStudent = await User.findOneAndUpdate(
                {_id : userId} ,
                {$push : {courses : courseId}} ,
                {new : true},
            )

            if(!enrolledStudent){
                throw new ApiError(404 , "User Not Found")
            }

            console.log(enrolledStudent);

            // confirmation send mail
            const emailResponse = await mailSender(
                enrolledStudent.email ,
                "Congratulation - " ,
                "Congratulation you are onboarded into new course" ,
            )

            console.log(emailResponse);

            return res.json(
                new ApiResponse(200 , emailResponse , "Email Response sended Successfully")
            )

        } catch (error) {
            console.log(error);
            throw new ApiError(404 , "Error while sending email")
        }
    }
    else {
        throw new ApiError(404 , "Security code doesnot match")
    }
};