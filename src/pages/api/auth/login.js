import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  // 1. We only want to handle POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Connect to the database
  await dbConnect();

  try {
    const { email, password } = req.body;

    // 3. Validate that email and password were provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 4. Find the user by their email address in the database
    const user = await User.findOne({ email });
    if (!user) {
      // Use a generic message to prevent attackers from finding registered emails
      return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
    }

    // 5. Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
    }

    // 6. If credentials are correct, create a JWT (JSON Web Token)
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role }, // Payload
      process.env.JWT_SECRET, // Your secret key
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 7. Send the token back to the user in a secure, httpOnly cookie
    res.setHeader(
      'Set-Cookie',
      serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day in seconds
        path: '/',
      })
    );

    // 8. Send a success response including the user's role for frontend redirection
    res.status(200).json({ success: true, role: user.role });

  } catch (error) {
    console.error("LOGIN API ERROR:", error);
    res.status(500).json({ message: "An internal server error occurred." });
  }
}