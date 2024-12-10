const express = require("express");
const router = express.Router();

//Import middleware 
const{auth, isInstructor} = require("../middlewares/auth");

//Import controller
const{
    deleteAccount,
    updateProfile,
    getAllUserDetails,
    updateDisplayPicture,
    getEnrolledCourses,
    instructorDashboard,
} = require("../controllers/Profile");

//Profile ke saare routes likh do

//Delete User account
router.delete("/deleteProfile", auth, deleteAccount);
//Update profile
router.put("/updateProfile", auth, updateProfile);
//Get User Details
router.get("/getUserDetails", auth, getAllUserDetails);

//Get Enrolled Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
//update Display Picture
router.put("/updateDisplayPicture", auth, updateDisplayPicture);
//instructor dashboard data
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)

module.exports = router;
