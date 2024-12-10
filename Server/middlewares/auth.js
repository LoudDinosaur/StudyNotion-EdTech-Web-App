const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");


//Note -> saare middlewares ki ordering we always done in routes

//auth ->  do authentication by verifying json web token and we parse token from 3 ways -> body, cookie and header(bearer-token)
exports.auth = async(req,res,next) => {
    try{
        //extract token
        const token = req.cookies.token 
                       || req.body.token
                       ||req.header("Authorization").replace("Bearer ","");

        //if token missing, then return response
        if(!token){
            return res.status(401).json({
                success:false,
                message:'Token is missing',
            });
        }

        //verify the token -> by using secret key and verify function
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET); // decode is basically our payload 
            console.log(decode);
            req.user = decode;
        }
        catch(err){
            //verification - issue
            return res.status(401).json({
                success:false,
                message:'token is invalid',
            });
        }
        next();
    }
    catch(error){
        return res.status(401).json({
            success:false,
            message:'Something went wrong while validating the token',
        });
    }
}

//isStudent
exports.isStudent = async(req,res,next) => {
    //ek approach ye hai k jo auth controller mein hamne payload banaya tha for jwt token usme hamne role accountType mein bheja tha 
    //and jab auth middleware mein humne use decode kiya toh hamein role bhi dikh raha hoga
    // so agar hum chahein toh role ko yahan bhu la sakte hain
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:'This is a protected route for Students only',
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified, please try again',
        })
    }
}

//isInstructor
exports.isInstructor = async(req,res,next) => {
    //ek approach ye hai k jo auth controller mein hamne payload banaya tha usme hamne role accountType mein bheja tha 
    //and jab auth middleware mein humne use decode kiya toh hamein role bhi dikh raha hoga
    // so agar hum chahein toh role ko yahan bhu la sakte hain
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:'This is a protected route for Instructors only',
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified, please try again',
        })
    }
}

//isAdmin
exports.isAdmin = async(req,res,next) => {
    //ek approach ye hai k jo auth controller mein hamne payload banaya tha usme hamne role accountType mein bheja tha 
    //and jab auth middleware mein humne use decode kiya toh hamein role bhi dikh raha hoga
    // so agar hum chahein toh role ko yahan bhu la sakte hain
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:'This is a protected route for Admins only',
            });
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:'User role cannot be verified, please try again',
        })
    }
}