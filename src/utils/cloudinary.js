import 'dotenv/config'
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

// Configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
	try {

		// console.log(localFilePath)

		// verification is file is not exists
		// if (!fs.existsSync(localFilePath)) {
		// 	console.error("File does not exist at path:", localFilePath);
		// 	return null;
		// }

		if (!localFilePath) return null
		// upload the file on cloudnary from local path (which is public folder)
		const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });

		// file has been uploaded successfully
		// console.log("File is uploaded on cloudinay ", response.url);
		fs.unlinkSync(localFilePath);
		return response

	} catch (error) {
		console.log(error)
		fs.unlinkSync(localFilePath); // removes the locally saved temporary files as the upload operation goes failed.
		return null;

	}
}

const deleteOnCloudinary = async (publicId, resourseType) => {
	try {
		console.log(publicId, resourseType)
		if (!publicId) return null;

		// const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourseType });
		const result = await cloudinary.api.delete_resources([publicId], { type: 'upload', resource_type: resourseType })
		// console.log(result)
		return result
			
	} catch (error) {
		console.error('Error while deleting on cloudinary:', error);
		throw error;
	}
}

export { uploadOnCloudinary, deleteOnCloudinary }