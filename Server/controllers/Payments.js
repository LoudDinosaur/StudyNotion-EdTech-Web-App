const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const mongoose= require("mongoose");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");

//initiate the razorpay order
exports.capturePayment = async(req, res) => {

    const {courses} = req.body;
    const userId = req.user.id;

    if(courses.length === 0) {
        return res.json({
            success:false, 
            message:"Please provide Course Id"
        });
    }

    let totalAmount = 0;

    for(const course_id of courses) {
        let course;
        try{
           
            course = await Course.findById(course_id);
            if(!course) {
                return res.status(200).json({
                    success:false, 
                    message:"Could not find the course"
                });
            }

            const uid  = new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({success:false, message:"Student is already Enrolled"});
            }

            totalAmount += course.price;
        }
        catch(error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }
    // const currency = "INR";
    const options = {
        amount: totalAmount * 100,
        currency : "INR",
        receipt: Math.random(Date.now()).toString(),
    }

    try{
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse)
        res.json({
            success:true,
            message:paymentResponse,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({success:false, mesage:"Could not Initiate Order"});
    }

}


//verify the payment
exports.verifyPayment = async(req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
            return res.status(200).json({success:false, message:"Payment Failed"});
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

        if(expectedSignature === razorpay_signature) {
            //enroll karwao student ko
            await enrollStudents(courses, userId, res);
            //return res
            return res.status(200).json({success:true, message:"Payment Verified"});
        }
        return res.status(200).json({success:"false", message:"Payment Failed"});

}


const enrollStudents = async(courses, userId, res) => {

    if(!courses || !userId) {
        return res.status(400).json({success:false,message:"Please Provide data for Courses or UserId"});
    }

    for(const courseId of courses) {
        try{
            //find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
            {_id:courseId},
            {$push:{studentsEnrolled:userId}},
            {new:true},
        )

        if(!enrolledCourse) {
            return res.status(500).json({success:false,message:"Course not Found"});
        }


        //course kharidne ke baad initially student ki progress toh 0 hi rahegi
        const courseProgress = await CourseProgress.create({
            courseID:courseId,
            userId:userId,
            completedVideos:[],
        })

        //find the student and add the course to their list of enrolledCOurses also include new courseProgress with initial courseProgress 0
        const enrolledStudent = await User.findByIdAndUpdate(userId,
            {$push:{
                courses: courseId,
                courseProgress:courseProgress._id,
            }},{new:true})
            
        ///bachhe ko mail send kardo
        const emailResponse = await mailSender(
            enrollStudents.email,
            `Successfully Enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
        )    
        //console.log("Email Sent Successfully", emailResponse.response);
        }
        catch(error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }

}

exports.sendPaymentSuccessEmail = async(req, res) => {
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({success:false, message:"Please provide all the fields"});
    }

    try{
        //student ko dhundo
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
             paymentSuccessEmail(`${enrolledStudent.firstName}`,
             amount/100,orderId, paymentId)
        )
    }
    catch(error) {
        console.log("error in sending mail", error)
        return res.status(500).json({success:false, message:"Could not send email"})
    }
}

// //capture the payment and initiate the Razorpay order
// exports.capturePayment = async (req,res) => {
//     //fetch courseId and UserId
//     const {course_id} = req.body; //ise body se nikaal liya
//     const userId = req.user.id;  //ise toh already payload mein send krke decode payload ki req ki body mein daal diay tha
//     //validation
//     //valid courseId
//     if(!course_id){
//         return res.json({
//             success:false,
//             message:'Please provide valid course ID',
//         })
//     }
//     //valid courseDetail
//     let course;
//     try{
//         course = await Course.findById(course_id);  //DB call
//         if(!course){
//             return res.json({
//                 success:false,
//                 message:'Could not find the course',
//             });
//         }

//         //convert string userId to objectId as in studentEnrolled schema it is stored in objectId type
//         const uid = mongoose.Types.ObjectId(userId); 
//          //check if user already pay for the same course
//         if(course.studentsEnrolled.includes(uid)){
//             return res.status(200).json({
//                 success:false,
//                 message:'Student is already enrolled',
//             });
//         }
//     }
//     catch(error){
//         console.error(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         })
//     }

//     //create order
//     const amount = course.price;
//     const currency = "INR";

//     const options = { //mandatory data sirf amount and currency hai baaki sabh toh optional hai
//         amount:amount * 100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes:{ //notes is basically additonal data
//             courseId: course_id,
//             userId
//         }
//     };
//     try{
//         //initiate the payment using razorpay
//         const paymentResponse = await instance.orders.create(options);  //Razorpay instance is used here
//         console.log(paymentResponse);

//          //return response
//          return res.status(200).json({
//             success:true,
//             courseName:course.courseName,
//             courseDescription:course.courseDescription,
//             thumbnail:course.thumbnail,
//             orderId:paymentResponse.id,
//             currency:paymentResponse.currency,
//             amount:paymentResponse.amount,
//          });
//     }
//     catch(error){
//         console.log(error);
//         res.json({
//             success:false,
//             message:'Could not initiate order',
//         });
//     }
// };

// //verify Signature of Razorpay and Server

// exports.verifySignature = async (req,res) => {
//     const webhookSecret = "12345678"; //ye hamne diya hai -> ye hamare waala signature hai//server pr hai ye

//     const signature = req.headers["x-razorpay-signature"]; //ye razorpay se aa rha hai

//     const shasum = crypto.createHmac("sha256", webhookSecret); //A
//     shasum.update(JSON.stringify(req.body)); //B
//     const digest = shasum.digest("hex");  //C -> webhook secret is convert into digest

//     //now match signature and figest ko match krna hai
//     if(signature === digest){
//         console.log("Payment is Authorised");

//         const {courseId, userId} = req.body.payload.payment.entity.notes;

//         try{
//             //fulfill the action as validation last function mein ho gayi saari
//             const enrolledCourse = await Course.findOneAndUpdate(
//                                             {_id:courseId},
//                                             {
//                                                 $push:{studentsEnrolled:userId}
//                                             },
//                                             {new:true},
//             );

//             if(!enrolledCourse){
//                 res.status(500).json({
//                     success:false,
//                     message:'Course not Found',
//                 });
//             }

//             console.log(enrolledCourse);

//             //find the student and add the course to their list enrolled courses mein
//             const enrolledStudent = await User.findOneAndUpdate(
//                                             {_id:userId},
//                                             {
//                                                 $push:{courses:courseId}
//                                             },
//                                             {new:true},
//             );

//             console.log(enrolledStudent);

//             //mail send krdo confirmation ki
//             const emailResponse = await mailSender(
//                                     enrolledStudent.email,
//                                     "Congratulations from StudyNotion",
//                                     "Congratulations, you are onboarded into new StudyNotion Course",
//             );

//             console.log(emailResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:"Signature Verified And Course Added"
//             });
//         }
//         catch(error){
//             console.log(error);
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             })
//         }
//     }
//     else{
//         //signature match nhi hua toh response return krdo
//         return res.status(400).json({
//             success:false,
//             message:'Invalid Request',
//         })
//     }
// };