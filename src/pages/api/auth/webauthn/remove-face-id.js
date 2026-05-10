import dbConnect from '../../../../../lib/dbConnect';
import User from '../../../../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Clear the passkeys array for this user
    await User.findByIdAndUpdate(decoded.userId, { 
      $set: { passkeys: [] } 
    }, { strict: false });

    return res.status(200).json({ success: true, message: 'Face ID removed successfully' });
  } catch (error) {
    console.error('Remove Face ID Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
