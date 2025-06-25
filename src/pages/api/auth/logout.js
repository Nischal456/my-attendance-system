import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Your code for expiring the cookie is correct.
  // We are creating a Set-Cookie header that tells the browser
  // to overwrite the 'token' cookie with an empty value and an expiry date in the past.
  const cookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    expires: new Date(0), // Set expiry date to the beginning of time
    path: '/', // Apply this to the entire site
  });

  // Apply this header to the response
  res.setHeader('Set-Cookie', cookie);

  // Send a success response
  res.status(200).json({ message: 'Logged out successfully' });
}