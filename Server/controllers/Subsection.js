const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
require("dotenv").config();
const { uploadImageToCloudinary } = require("../utils/imageUploader");


//create Subsection
exports.createSubSection = async (req,res) => {
    try{
        //fetch data from req body -> sectionId use hogi bcoz hamein waapas subsection ko section mein insert krna hai
        const {sectionId, title, description} = req.body;
        //extract file/video
        const video = req.files.video;
        //validation
        if(!sectionId || !title || !description || !video){
            return res.status(400).json({
                success:false,
                message:'All fields are Required',
            });
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(
            video, 
            process.env.FOLDER_NAME);
            console.log(uploadDetails);
        //create a sub-section
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:`${uploadDetails.duration}`,
            description:description,
            videoUrl:uploadDetails.secure_url, //clodinary ka video link
        })
        //update section with this subSection ObjectId
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                    {
                                                        $push: {
                                                            subSection:subSectionDetails._id,
                                                        }
                                                    },
                                                    {new:true}).populate("subSection").exec();
        //HW: -> log updated section here ,agfter adding populate query
        //return response
        return res.status(200).json({
                success:true,
                data:updatedSection,
        });
    }
    catch(error){
        console.error("Error creating new sub-section:", error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
    }
};

//updateSubSection
exports.updateSubSection = async (req,res) => {
    try{
        //fetch data
        const {sectionId,subSectionId, title, description} = req.body;
        //find sectionId in DB
        const subSection = await SubSection.findById(subSectionId);
        //Validation
        if(!subSection){
            return res.status(404).json({
                success:false,
                message:"SubSection not found",
            })
        }
        //update tile if it is defined
        if(title !== undefined){
            subSection.title = title;
        }
        //update desciption if it is defined
        if(description !== undefined){
            subSection.description = description;
        }
        //update video on cloudinary
        if(req.files && req.files.video !== undefined){
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME,
            )
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`;
        }
        //finally save all using mongoose
        await subSection.save();

        const updatedSection = await Section.findById(sectionId).populate("subSection")

        //return response
        return res.json({
            success:true,
            data: updatedSection,
            message:"Section Updated Successfully",
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"An error occured while updating the section",
        });
    }
};

//deleteSubSection
exports.deleteSubSection = async (req,res) => {
    try{
      //fetch data
      const {subSectionId, sectionId} = req.body;
      await Section.findByIdAndUpdate(
        {_id: sectionId},
        {
            $pull:{
                subSection: subSectionId,
            },
        }
      )
      const subSection = await SubSection.findByIdAndDelete(
        {_id:subSectionId}
      );

      //Thoda Vlaidate bhi krlo
      if(!subSection){
        return res.status(404).json({
            success:false,
            message:"SubSection not found"
        });
      }

      const updatedSection = await Section.findById(sectionId).populate("subSection")
      //return response
      return res.json({
        success:true,
        data: updatedSection,
        message:"Subsection deleted successfully",
      });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"An error occured while deleting the SubSection",
        })
    }
};