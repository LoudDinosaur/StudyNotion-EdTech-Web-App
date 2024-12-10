const Category = require("../models/category");
const Course = require("../models/Course");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/secToDuration");

//createCourse handler function
exports.createCourse = async (req, res) => {
  try {
    //fetch data -> get userId from request object
    const userId = req.user.id;

    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag,
      category,
      status,
      instructions,
    } = req.body;

    //get thumbnail from file -> fetch file
    const thumbnail = req.files.thumbnailImage;

    //Validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
      !category ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are Mandatory",
      });
    }

    if (!status || status === undefined) {
      status = "Draft";
    }

    //check for instructor
    // const userId = req.user.id;
    const instructorDetails = await User.findById(userId, {
      accountType: "Instructor",
    });
    // console.log("Instructor Details: ", instructorDetails);
    //todo: verify that userId and instructorDeatils._id are same or different

    //agar instructor ka data mila hi nhi
    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details not found",
      });
    }

    //check given tag is valid or not
    const categoryDetails = await Category.findById(category); //as tag toh ref mein bheja hua in Course model toh id se hi access hoga
    //agar tag ki details aayi hi nhi
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category Details not found",
      });
    }

    //Upload Image to Cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    console.log(thumbnailImage);

    //create an entry for new course
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id, // ab samajh aaya ki kyun user id nikaali -> taaki instructor id aa jaaye
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag: tag,
      category: categoryDetails._id, //tag bhi verified waala use ho gaya
      thumbnail: thumbnailImage.secure_url, // cloudinary ka secure url le liya from cloudinary
      status: status,
      instructions: instructions,
    });

    //add the new course to the User Schema of Instructor . waise bhi student ka course buy krte hi aa jayega uske schema mein
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    //update krdo Category ka schema
    await Category.findByIdAndUpdate(
      { _id: category },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );
    //return response
    return res.status(200).json({
      success: true,
      data: newCourse,
      message: "Course Created Successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Course",
      error: error.message,
    });
  }
};

// Edit Course Details
exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const updates = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // If Thumbnail Image is found, update it
    if (req.files) {
      console.log("thumbnail update");
      const thumbnail = req.files.thumbnailImage;
      const thumbnailImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
      course.thumbnail = thumbnailImage.secure_url;
    }

    // Update only the fields that are present in the request body
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (key === "tag" || key === "instructions") {
          course[key] = JSON.parse(updates[key]);
        } else {
          course[key] = updates[key];
        }
      }
    }

    //updated at
    course.updatedAt = Date.now();

    await course.save();

    const updatedCourse = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while updating course",
      error: error.message,
    });
  }
};

//getAllCourses handler function
exports.getAllCourses = async (req, res) => {
  try {
    //Todo: change the below statement incrementally
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();
    //return response
    return res.status(200).json({
      success: true,
      data: allCourses,
      message: "Data for all courses fetched successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot Fetch Course Data",
      error: error.message,
    });
  }
};

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
  try {
    //get id
    const { courseId } = req.body;
    //find course details
    const courseDetails = await Course.findOne({ _id: courseId })
      .populate({
        //is tarah se hamne instructure and uski additionalDetials ka data bhi populate krwa diya
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        //course section ke saath uske subSection ko  bhi
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "-videoUrl",
        },
      })
      .exec();

    //validation
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    //return response
    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      data: {
        courseDetails,
        totalDuration,
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//getFullCourseDetails
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    });

    console.log("courseProgressCount : ", courseProgressCount);

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
    const instructorId = req.user.id;

    // Find all courses belonging to the instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 });

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    });
  }
};

// Delete the Course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentsEnrolled;
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      });
    }

    // Delete sections and sub-sections
    const courseSections = course.courseContent;
    for (const sectionId of courseSections) {
      // Delete sub-sections of the section
      const section = await Section.findById(sectionId);
      if (section) {
        const subSections = section.subSection;
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId);
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId);
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
