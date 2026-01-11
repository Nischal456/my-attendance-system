import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  try {
    const { userId, isActive } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Force boolean conversion
    const status = isActive === true;

    const user = await User.findByIdAndUpdate(
      userId, 
      { isActive: status }, 
      { new: true } 
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
        success: true, 
        message: status ? 'User Re-Activated Successfully' : 'User Moved to Alumni',
        data: user
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}