import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  try {
    // 1. Fetch users where isActive is true
    // 2. Select only name, avatar, email, and role (for security/speed)
    const users = await User.find({ isActive: true })
      .select('name avatar email role')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("User List API Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching users" });
  }
}