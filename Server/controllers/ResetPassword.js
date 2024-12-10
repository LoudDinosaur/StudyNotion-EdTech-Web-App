const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//resetPasswordToken -> mail bhejne ka kaam ye bhai kr rhe hain
exports.resetPasswordToken = async (req,res) => {
    try{
        //get email from req ki body
        const email = req.body.email; // bina de-structuring ke aise bhi nikaal sakte hain
        //check user for this email , email Validation
        const user = await User.findOne({email: email}); //check krlo user pehle se exist toh nhi karta
        if(!user){
            return res.json({
                success:false,
                message:`This Email: ${email} is not Registered With Us Enter a Valid Email `,
            });
        } 
        //generate token
        const token = crypto.randomBytes(20).toString("hex");
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            {email: email},
            {
                token:token,
                resetPasswordExpires: Date.now() + 3600000, //give expiration time of 6 mins
            },
            {new: true}
        );
        console.log("DETAILS" , updatedDetails);
        //create url
        const url = `http://localhost:3000/update-password/${token}`
        //send mail containing the url
        await mailSender(
            email,
            "Password Reset",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        );
        //return response
         res.json({
            success:true,
            message:'E-mail sent Successfully, please check E-mail and change Password'
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:`Some Error in Sending the Reset Message`,
        });
    }
}


//resetPassword -> DB mein password isse update hoga

exports.resetPassword = async (req,res) => {
    try{
        //data fetch
        const {password, confirmPassword, token} = req.body;
        //validation
        if(confirmPassword !== password){
            return res.json({
                success:false,
                message:"Password and Confirm Password Does not Match",
            });
        }
        //get userDetails from db using token
        const userDetails = await User.findOne({token: token});
        //if no entry -> invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:'Token is Invalid',
            });
        }
        //token time check -> kahin token expire toh nhi ho gaya
        if(!(userDetails.resetPasswordExpires > Date.now())){
            return res.json({
                success:false,
                message:'Token is Expired, Please Regenerate Your Token'
            });
        }
        //  Hash password
        const hashedPassword = await bcrypt.hash(password , 10); //10 rounds for higher level encryption

        //password update
        await User.findOneAndUpdate(
            {token: token},   // this line is for searching criteria as each token is unique for each user
            {password: hashedPassword},  //update the password with the newPassword which is now hashed
            {new: true},       // this line is for generating new doc so that we don't get old doc again
        );
        //return response
        res.json({
            success:true,
            message: 'Password Reset Successfully',
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'Some Error in Updating the Password',
        })
    }
}