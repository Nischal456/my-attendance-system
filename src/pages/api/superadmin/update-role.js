import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // 1. Strict Superadmin Verification
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const requester = await User.findById(decoded.userId);

    if (!requester || requester.role !== 'Superadmin') {
      return res.status(403).json({ message: 'Forbidden: Only Superadmins can perform this action.' });
    }

    // 2. Parse Request Body
    const { userId, accessRoles } = req.body;

    if (!userId || !Array.isArray(accessRoles)) {
      return res.status(400).json({ message: 'User ID and accessRoles array are required.' });
    }

    // Prevent Superadmin from accidentally demoting themselves
    if (userId === requester._id.toString() && !accessRoles.includes('Superadmin')) {
        return res.status(400).json({ message: 'You cannot revoke your own Superadmin access. Another Superadmin must do this.' });
    }

    // 4. Update the User's accessRoles
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { accessRoles: accessRoles },
        { new: true }
    ).select('-password');

    if (!updatedUser) {
        return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: `Access rights successfully updated.`, data: updatedUser });

  } catch (error) {
    console.error("Error in update-role API:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
