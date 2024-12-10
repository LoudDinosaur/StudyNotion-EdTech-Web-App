const express = require("express");
const router = express.Router();

//Import the controllers and middlewares
const{
    logIn,
    signUp,
    sendOTP,
    changePassword,
} = require("../controllers/Auth");

const{
    resetPasswordToken,
    resetPassword,
} = require("../controllers/ResetPassword");

//Import Middleware
const {auth} = require("../middlewares/auth");

//Ab create krdo routes for all User Functionalities

//Route for user logIn
router.post("/login", logIn);
//Route for user signup
router.post("/signup", signUp);
//Route for sendingOTP to user's email
router.post("/sendotp", sendOTP);
//Route for changing the password
router.post("/changepassword", auth, changePassword);


//RESET PASSWORD

//Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken);
//Route for resetting user's password after verification
router.post("/reset-password", resetPassword);

module.exports = router;