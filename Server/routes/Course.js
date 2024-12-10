//Take express instance
const express = require("express");
const router = express.Router();

//Import all the controllers

//Course Controller
const{
    createCourse,
    getAllCourses,
    getCourseDetails,
    getFullCourseDetails,
    editCourse,
    getInstructorCourses,
    deleteCourse,
} = require("../controllers/Course");

//Categories Controller
const{
    showAllCategories,
    createCategory,
    categoryPageDetails,
} = require("../controllers/Category");

//Sections Controller
const{
    createSection,
    updateSection,
    deleteSection,
} = require("../controllers/Section");

//Sub-Sections Controller
const{
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require("../controllers/Subsection");

//RatingAndReview Controller
const{
    createRating,
    getAverageRating,
    getAllRating,
} = require("../controllers/RatingAndReview");

//Course Progress Controller Import
const {
    updateCourseProgress
} = require("../controllers/courseProgress")

//import Middlewares
const {auth, isInstructor, isStudent, isAdmin} = require("../middlewares/auth");

//Now create the course routes jo hume chahiye

//Courses can only be created by instructors
router.post("/createCourse", auth, isInstructor, createCourse);
//Add a Section to a Course
router.post("/addSection", auth, isInstructor, createSection);
//Update a Section
router.post("/updateSection", auth, isInstructor, updateSection);
//Delete a Section
router.post("/deleteSection", auth, isInstructor, deleteSection);
//Edit Sub-Section
router.post("/updateSubSection", auth, isInstructor, updateSubSection);
//Delete Sub-Section
router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);
//Add a Sub Section to a section
router.post("/addSubSection", auth, isInstructor, createSubSection);
//Get all Registered Courses
router.get("/getAllCourses", getAllCourses);
//Get all Details for specific Courses
router.post("/getCourseDetails", getCourseDetails);
router.post("/getFullCourseDetails", auth, getFullCourseDetails)
// Edit Course routes
router.post("/editCourse", auth, isInstructor, editCourse)
// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
// Delete a Course
router.delete("/deleteCourse", deleteCourse)

//update Course Progress
router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);

 //CATEGORY ROUTES[ONLY BY ADMIN]
 //Category can only be created by admin
 // TODO: Put IsAdmin Middleware here
 router.post("/createCategory", auth, isAdmin, createCategory);
 router.get("/showAllCategories", showAllCategories);
 router.post("/getCategoryPageDetails", categoryPageDetails);


 //RATING AND REVIEW
 router.post("/createRating", auth, isStudent, createRating);
 router.get("/getAverageRating", getAverageRating);
 router.get("/getReviews", getAllRating);

 module.exports = router;