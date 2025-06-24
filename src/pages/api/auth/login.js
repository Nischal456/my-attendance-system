
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  // We only want to handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const { email, password } = req.body;

  // Find the user by their email in the database
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Check if the provided password matches the hashed password in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // If credentials are correct, create a JWT (JSON Web Token)
  const token = jwt.sign(
    { userId: user._id, name: user.name, role: user.role }, // This is the data stored in the token
    process.env.JWT_SECRET, // The secret key from your .env.local file
    { expiresIn: '1d' } // The token will be valid for 1 day
  );

  // Send the token back to the user in an HTTP-only cookie
  // This is a secure way to store authentication tokens
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

  // Send a success response
  res.status(200).json({ message: 'Login successful' });
}
