const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course")
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

exports.updateProfile = async (req, res) => {
  try {
    //get data
    const { dateOfBirth = "", about = "", contactNumber } = req.body;
    //getuserId
    const id = req.user.id;
    //   //validation
    //   if(!contactNumber || !gender || !id){
    //     return res.status(400).json({
    //         success:false,
    //         message:'All fields are required',
    //     });
    //   }
    //findProfile by id
    const userDetails = await User.findById(id);
    const profile = await Profile.findById(userDetails.additionalDetails); //see user schema

    //updateProfile
    profile.dateofBirth = dateOfBirth;
    profile.about = about;
    profile.contactNumber = contactNumber;
    //save the updated profile
    await profile.save();

    //return response
    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//deleteAccount handler
//How can we schedule a deletion job
exports.deleteAccount = async (req, res) => {
  try {
    //getid
    console.log("Printing ID: ", req.user.id);
    const id = req.user.id; //already sent in payload in decode payload and send to req of user

    //validation
    const user = await User.findById({ _id: id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    //delete Profile user ki
    await Profile.findByIdAndDelete({ _id: user.additionalDetails });
    //TODO: unenroll user from all enrolled courses
    // Now delete user
    await User.findByIdAndDelete({ _id: id });

    //return response
    return res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be Deleted Successfully",
    });
  }
};

//getAll the details of user
exports.getAllUserDetails = async (req, res) => {
  try {
    //get id
    const id = req.user.id;
    //validation and get user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();
    console.log(userDetails);
    //return response
    return res.status(200).json({
      success: true,
      message: "User Data Fetched Successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update Display picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    //fetch data
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id; //payload mein already send kiya hua hai

    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    //update the profilePicture via mongoose call
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );

    //return response
    res.send({
      success: true,
      message: `Image Updated Successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//getEnrolledCourses handler
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    userDetails = userDetails.toObject();
    var SubsectionLength = 0;
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      SubsectionLength = 0;
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length;
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });
      courseProgressCount = courseProgressCount?.completedVideos.length;
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100;
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2);
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier;
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//instructor dashboard
exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id }); //instructor toh already logged in hai toh wahin se instructor id lelo

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      //create an new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };
      return courseDataWithStats;
    });

    res.status(200).json({ courses: courseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error bro" });
  }
};
