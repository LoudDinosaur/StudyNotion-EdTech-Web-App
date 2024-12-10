//import cloudinary
const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    const options = {folder};
    //agar height and quality bhi aa rhi hai function mein toh use bhi include krlo option mein
    if(height){
        options.height = height;
    }
    if(quality){
        options.quality = quality;
    }
    //apne aap determine krlo ki kis type ka resource hai
    options.resource_type ="auto";

    return await cloudinary.uploader.upload(file.tempFilePath, options);
}