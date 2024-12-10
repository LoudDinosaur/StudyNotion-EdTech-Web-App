const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

//createRating handler
exports.createRating = async (req,res) => {
    try{
        //getUserId
        const userId = req.user.id; //basic payload waala concept jisme token alredy passed hai when user logged in
        //fetch data from req.body
        const {rating, review, courseId} = req.body;
        //check if user is enrolled or not
        const courseDetails = await Course.findOne(
            {
                _id:courseId,
                studentsEnrolled: {$elemMatch: {$eq: userId}},
            });
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:"Student is not enrolled in the course",
            });
        }
        //check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            user:userId,
            course:courseId,
        });
        if(alreadyReviewed){
            return res.status(403).json({
                success:false,
                message:"Course is already reviewed by the user",
            });
        }
        //create rating and review
        const ratingReview = await RatingAndReview.create({
            rating, review,
            course:courseId,
            user:userId,
        });
        //update course with this rating/review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId},
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            {new: true}
        );
        console.log(updatedCourseDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating And Review Successfully",
            ratingReview,
        });
    }
     catch(error){
        console.log(error);
        return res.json({
            success:false,
            message:error.message,
        });
    }
};

//getAverageRating Handler
exports.getAverageRating = async (req,res) => {
    try{
        //get courseId
        const courseId = req.body.courseId;
        //calculate average rating
        const result = await RatingAndReview.aggregate([
            {
                $match:{ //us field ko match karo us entry mein jisme course ki key ke andar courseId ki value ho
                    course: mongoose.Types.ObjectId(courseId), //courseId was string so convert in object
                },
            },
            {
                $group: {
                    _id:null, //jitni bhi id aayi thi usko single group mein return kr diya
                    averageRating: { $avg: "$rating"},
                }
            }
        ])
        //return rating
        if(result.length > 0){
             return res.status(200).json({
                success:true,
                averageRating: result[0].averageRating, //$group array of values ko return karega toh 0th index se access kr liya
             })
        }

        //if no rating.Review exist -> toh rating 0 return krdo
        return res.status(200).json({
            success:true,
            message:"Average Rating is 0, no ratings given till now",
            averageRating:0,
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

//getAllRatingAndReviews

exports.getAllRating = async (req,res) => {
    try{
        const allReviews = await RatingAndReview.find({})
                                      .sort({rating: "desc"})
                                      .populate({
                                        path:"user",
                                        select:"firstName lastName email image", //sirf inhi cheezon ko populate krna hai
                                      })
                                      .populate({
                                        path:"course",
                                        select:"courseName",
                                      })
                                      .exec();
        
        //return response
        return res.status(200).json({
            success:true,
            message:"All Reviews Fetched Successfully",
            data:allReviews,
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}