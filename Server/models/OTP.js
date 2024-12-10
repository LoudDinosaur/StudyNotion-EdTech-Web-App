const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email: {
        type:String,
        required:true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires: 5*60,  //doc delete after 5 minutes of creation time
    }
});



//function -> to send emails -> kisko mail bhejun and kya otp bhejun
async function sendVerificationEmail(email, otp){
    try{
        const mailResponse = await mailSender(
            email,
            "Verification Email", 
            emailTemplate(otp)
        );
        console.log("Email Sent Successfully", mailResponse.response);
    }
    catch(error){
        console.log("error occured while sending mails: ",error);
        throw error;
    }
}
//Now use pre-save middleware
OTPSchema.pre("save", async function(next){
    console.log("New document saved to database");

    //only send email whean a new document is created
    if(this.isNew){
        await sendVerificationEmail(this.email , this.otp);
    }
    next();
});

const OTP = mongoose.model("OTP", OTPSchema);
module.exports = OTP;