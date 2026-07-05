import { v2 as cloudinary } from 'cloudinary';

// Configure lazily so dotenv is guaranteed to have loaded first.
// Call this before any upload operation.
export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export default cloudinary;
