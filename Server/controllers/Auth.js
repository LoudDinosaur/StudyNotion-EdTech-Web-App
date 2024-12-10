const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");


//signUp
exports.signUp = async (req,res) => {
  
    try{
         //data fetch karo from request ki body -> all this data is entered buy iser on UI
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        //validate krlo
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success:false,
                message:"All fields are required",
            });
        }

        //2 password match krlo -> password and confirm password
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:'Password and ConfirmPassword value does not match, please try again',
            });
        }

        //check if user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already exists. Please sign in to continue.',
            });
        }

        //find most recent OTP stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);

        //validate otp
        if(recentOtp.length == 0){
            //otp not found
            return res.status(400).json({
                success:false,
                message:'The OTP is not valid',
            })
        }
        else if(otp !== recentOtp[0].otp){
            //Invalid otp
            return res.status(400).json({
                success:false,
                message:'The OTP is not valid',
            });
        }

        //Hash Password
        const hashedPassword = await bcrypt.hash(password, 10); //10 rounds for more secure and hard encryption

        //Create the user
        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);

        //create additional profile for user
        const profileDetails = await Profile.create({ //here we create an profile object for additionalDetails in User Schema
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            approved: approved,
            additionalDetails:profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        //return res
        return res.status(200).json({
            success:true,
            user,
            message:'User is Registered Successfully',
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'User cannot be registered. Please try again',
        });
    }
};

//logIn
exports.logIn = async (req,res) => {    
    try{
        //get data from req body
        const{email,password} = req.body;
        //validation data
        if(!email || !password) {
            return res.status(400).json({
                success:false,
                message:'Please Fill up All the Required Fields',
            });
        }

        //check user exist or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            //401-> unauthorised status
            return res.status(401).json({
                success:false,
                message:'User is not Registered with Us Please SignUp to Continue',
            });
        }
        //generate JWT, after password matching -> agar passwird match kr rha hai toh ek token generatekaro and response
                                                  //generate karo and response mein cookie bhi add krdena
        if(await bcrypt.compare(password, user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                accountType:user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn:"24h",
            });
            //save token to user document in DB
            user.token= token;
            user.password= undefined;

            //create cookie for token and send response
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000), // cookie expire in 3 days
                httpOnly:true,
            }
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user,
                message:"Logged In Successfully"
            });
        }
        else{
            return res.status(401).json({
                success:false,
                message:'Password is Incorrect',
            });
        }   
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
        success:false,
        message:'Login Failure, Please Try Again',
        });
    }
};

//sendOTP -> otp verify hone ke baad hi successfull signup hoga
exports.sendOTP = async(req,res) => {
    try{

        //fetch email from request ki body
        const{email} = req.body;

        //check if user already exist
        const checkUserPresent = await User.findOne({email});

        //if user already exist,then return a response
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:'User Already Registered',
            });
        }

        //generate otp -> 6 length ka otp banana hai
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });

        //check unique otp or not
        const result = await OTP.findOne({otp: otp});
        console.log("Result is Generate OTP Func");
        console.log("OTP", otp);
        console.log("Result", result);

        while(result){
            otp = otpGenerator.generate(6,{
                upperCaseAlphabets:false,
                // lowerCaseAlphabets:false,
                // specialChars:false,
            });
            // result = await OTP.findOne({otp: otp});
        }

        const otpPayLoad = {email, otp};

        //create an entry for otp
        const otpBody = await OTP.create(otpPayLoad);
        console.log("OTP Body", otpBody);

        //return response successful
        res.status(200).json({
            success:true,
            message:'OTP Sent Successfully',
            otp,
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};


//change Password
//Ye khud se try karo
exports.changePassword = async (req,res) => {
    try{
        //get data from req body
        const userDetails = await User.findById(req.user.id); 

        //get oldPassword, newPassword and confirmNewPassword from req.body
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        //Validate old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if(!isPasswordMatch){
            //if old password does not match , return error
            return res.status(401).json({
                success:false,
                message:"The password is incorrect",
            });
        }

        //Match new password and confirm new password
        if(newPassword !== confirmNewPassword){
            //if new password does not match with confirm new Password return bad request
            return res.status(400).json({
                success:false,
                message: "The password and confirm password does not match",
            });
        }
        //Update Password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true}
        );
        //send mail -> Password Updated
        try{
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            console.log("Email sent successfully: ", emailResponse.response);
        }
        catch(error){
            //if there is error in sending mail return 500-> Internal server error
            console.error("Error occured while sending email: ", error);
            return res.status(500).json({
                success:false,
                message:"Error occurred while sending email",
                error:error.message,
            });
        }

        //return success response
        return res.status(200).json({
            success:true,
            message:"Password updated successfully",
        });
    }
    catch(error){
        console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});
    }
};

