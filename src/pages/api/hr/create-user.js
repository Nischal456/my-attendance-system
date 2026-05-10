import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // 1. Authenticate the user making the request
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Authorize: Make sure the user is an HR Manager or Superadmin
    const requestUser = await User.findById(decoded.userId);
    const allUserRoles = [requestUser.role, ...(requestUser.accessRoles || [])];
    if (!requestUser || !allUserRoles.some(r => ['HR', 'Superadmin'].includes(r))) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
    }

    // 3. Get new user data from the form
    const { name, email, password, role, phoneNumber, avatar } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    // Strict Check: Only Superadmins can create Superadmins
    if (role === 'Superadmin' && requestUser.role !== 'Superadmin') {
        return res.status(403).json({ message: 'Forbidden: Only existing Superadmins can assign the Superadmin role.' });
    }

    // 4. Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // 5. Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Create the new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phoneNumber: phoneNumber || null,
      createdBy: requestUser._id
    });

    await newUser.save();

    res.status(201).json({ success: true, message: `User '${name}' created successfully.` });

  } catch (error) {
    console.error("Create User API Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}