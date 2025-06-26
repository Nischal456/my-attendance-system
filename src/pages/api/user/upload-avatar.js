// pages/api/user/upload-avatar.js
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

// Configure Cloudinary with your credentials from .env.local
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // It's good practice to set this to true
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    // --- THIS IS THE UPDATED PART ---
    // Replace 'your_preset_name_here' with the actual "Preset name" you copied from your Cloudinary dashboard.
    const UPLOAD_PRESET = 'Preset name';

    // Upload the image to Cloudinary using the unsigned preset
    const uploadResponse = await cloudinary.uploader.upload(image, {
      upload_preset: UPLOAD_PRESET,
    });

    // Update the user's avatar URL in the database with the secure URL from Cloudinary
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { avatar: uploadResponse.secure_url },
      { new: true } // This option returns the updated document
    );

    res.status(200).json({ success: true, avatar: updatedUser.avatar });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Image upload failed.' });
  }
}