import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and clear the promotion flag
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.hasUnseenPromotion = false;
    await user.save();

    res.status(200).json({ success: true, message: 'Promotion acknowledged' });
  } catch (error) {
    console.error("Error acknowledging promotion:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
