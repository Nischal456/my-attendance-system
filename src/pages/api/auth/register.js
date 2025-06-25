import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { name, email, password, role, phoneNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields. Name, email, password, and role are required.' });
    }

    // --- THIS IS THE CORRECTED LINE ---
    // We have now added 'Project Manager' to the list of roles that can be assigned.
    const assignableRoles = ['Staff', 'Intern', 'Manager', 'Project Manager'];
    
    // This security check will now allow 'Project Manager' but still block 'HR'.
    if (!assignableRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: The selected role is not assignable.' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role,
      phoneNumber: phoneNumber, 
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', userId: user._id });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}