const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");
const ApiResponse = require("../utils/ApiResponse.js");
const ApiError = require("../utils/ApiError.js");

exports.contactUsController = async (req, res) => {
    const { email, firstname, lastname, message, phoneNo, countrycode } = req.body
    console.log(req.body)
    try {
        const emailRes = await mailSender(
        email,
        "Your Data send successfully",
        contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
        )
        console.log("Email Res ", emailRes);
        return res.status(200).json(
            new ApiResponse(200 , emailRes , "Contact Us Controller executed successfully")
        )
        
    } catch (error) {
        throw new ApiError(400 , "Error in contact us controller");
    }
}