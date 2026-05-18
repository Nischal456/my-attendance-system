import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Expense from '../../../../models/Expense';
import User from '../../../../models/User';
import cloudinary from 'cloudinary';

// Configure cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  await dbConnect();

  const { token } = req.cookies;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const userId = decoded.userId;

  if (req.method === 'GET') {
    try {
      const user = await User.findById(userId);
      const isAuthorized = ['Superadmin', 'Finance', 'Manager', 'Project Manager'].includes(user.role) || (user.accessRoles && user.accessRoles.includes('Expense Manager'));

      let filter = {};
      if (!isAuthorized) {
          filter.createdBy = userId;
      }

      const expenses = await Expense.find(filter)
        .populate('createdBy', 'name avatar role')
        .sort({ englishDate: -1, createdAt: -1 })
        .lean();
        
      return res.status(200).json({ success: true, data: expenses });
    } catch (error) {
      console.error("Fetch Expenses Error:", error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { title, amount, category, paymentMethod, nepaliDate, englishDate, notes, receiptImage } = req.body;

      if (!title || !amount || !category || !nepaliDate || !englishDate) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
      }

      let receiptUrl = null;

      // Handle base64 image upload to Cloudinary
      if (receiptImage && receiptImage.startsWith('data:image')) {
        try {
          const uploadResponse = await cloudinary.v2.uploader.upload(receiptImage, {
            folder: 'expenses',
          });
          receiptUrl = uploadResponse.secure_url;
        } catch (uploadError) {
          console.error("Cloudinary Upload Error:", uploadError);
          return res.status(500).json({ success: false, message: 'Failed to upload receipt image.' });
        }
      }

      const newExpense = await Expense.create({
        title,
        amount: Number(amount),
        category,
        paymentMethod: paymentMethod || 'Cash',
        nepaliDate,
        englishDate: new Date(englishDate),
        notes,
        receiptUrl,
        createdBy: userId,
        readBy: [], // explicitly empty array on creation
      });

      const populatedExpense = await Expense.findById(newExpense._id)
        .populate('createdBy', 'name avatar role');

      return res.status(201).json({ success: true, data: populatedExpense });
    } catch (error) {
      console.error("Create Expense Error:", error);
      return res.status(500).json({ success: false, message: 'Failed to create expense.' });
    }
  } 
  
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
