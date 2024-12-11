const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");


// exports.updateCourseProgress = async(req,res) => {
//     const {courseId, subSectionId} = req.body;
//     const userId = req.user.id;

//     try{
//         //check if the subsection is valid
//         const subSection = await SubSection.findById(subSectionId);

//         if(!subSection) {
//             return res.status(404).json({error:"Invalid SubSection"});
//         }

//         console.log("SubSection Validation Done");

//         //check for old entry 
//         let courseProgress = await CourseProgress.findOne({
//             courseID: courseId,
//             userId: userId,
//         })

//         if(!courseProgress) {
//             return res.status(404).json({
//                 success:false,
//                 message:"Course Progress does not exist"
//             });
//         }
//         else {
//             console.log("Course Progress Validation Done");
//             //check for re-completing video/subsection
//             if(courseProgress.completedVideos.includes(subSectionId)) {
//                 return res.status(400).json({
//                     error:"Subsection already completed",
//                 });
//             }

//             //push into completed video
//             courseProgress.completedVideos.push(subSectionId);
//             console.log("Course Progress Push Done");
//         }
//         await courseProgress.save();
//         console.log("Course Progress Save call Done");
//         return res.status(200).json({
//             success:true,
//             message:"Course Progress Updated Successfully",
//         })
//     }
//     catch(error) {
//         console.error(error);
//         return res.status(400).json({error:"Internal Server Error"});
//     }
// }

exports.updateCourseProgress = async (req, res) => {
    const { courseId, subsectionId } = req.body
    const userId = req.user.id
  
    try {
      // Check if the subsection is valid
      const subsection = await SubSection.findById(subsectionId)
      if (!subsection) {
        return res.status(404).json({ error: "Invalid subsection" })
      }
  
      // Find the course progress document for the user and course
      let courseProgress = await CourseProgress.findOne({
        courseID: courseId,
        userId: userId,
      })
  
      if (!courseProgress) {
        // If course progress doesn't exist, create a new one
        return res.status(404).json({
          success: false,
          message: "Course progress Does Not Exist",
        })
      } else {
        // If course progress exists, check if the subsection is already completed
        if (courseProgress.completedVideos.includes(subsectionId)) {
          return res.status(400).json({ error: "Subsection already completed" })
        }
  
        // Push the subsection into the completedVideos array
        courseProgress.completedVideos.push(subsectionId)
      }
  
      // Save the updated course progress
      await courseProgress.save()
  
      return res.status(200).json({ message: "Course progress updated" })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ error: "Internal server error" })
    }
  }