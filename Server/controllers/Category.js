const { Mongoose } = require("mongoose");
const Category = require("../models/category");
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

//create category ka handler function
exports.createCategory = async (req,res) => {
    try{
        //fetch data from req body
        const{name,description} = req.body;

        //validation
        if(!name){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }

        //create entry in DB
        const CategorysDetails = await Category.create({
            name:name,
            description:description,
        });
        console.log(CategorysDetails);

        //return response
        return res.status(200).json({
            success:true,
            message:"Categorys Created Successfully",
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

//showAllCategory handler function

exports.showAllCategories = async (req,res) => {
    try{
        //find data in DB
        const allCategorys = await Category.find({});

        //return response
        res.status(200).json({
            success:true,
            data:allCategorys,
        });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

//categoryPageDetails
exports.categoryPageDetails = async (req,res) => {
    try{
        //get CategoryId
        const {categoryId} = req.body;
        //get courses for specified categoryId
        const selectedCategory = await Category.findById(categoryId)
        .populate({
            path: "courses",
            match: { status: "Published" },
            populate: "ratingAndReviews",
          })
                                        .exec();
        // console.log(selectedCategory);

        //Handle case when category is not found
        //Validation
        if(!selectedCategory){
            console.log("Category not found");
            return res.status(404).json({
                success:false,
                message:'Category not found',
            });
        }
        //Handle the case when there are no courses
        if(selectedCategory.courses.length === 0){
            console.log("No courses found for the selected category");
            return res.status(404).json({
                success:false,
                message:"No courses found for the selected category",
            });
        }


       // Get courses for other categories
      const categoriesExceptSelected = await Category.find({
        _id: { $ne: categoryId },
      })
      let differentCategory = await Category.findOne(
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
          ._id
      )
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec()
        //console.log("Different COURSE", differentCategory)
      // Get top-selling courses across all categories
      const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec();

      const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
       // console.log("mostSellingCourses COURSE", mostSellingCourses)
      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
};