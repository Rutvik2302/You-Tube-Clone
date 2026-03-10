const cloudinary = require("cloudinary");
const { response } = require("express");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRATE,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File is uploaded on cloudinary", res.url);
    return res;
  } catch {
    fs.unlink(localFilePath); //remove the localfile from the server if the file is not go onto the cloudinary
  }
};

module.exports = uploadOnCloudinary;
