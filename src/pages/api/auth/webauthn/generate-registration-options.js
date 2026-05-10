import { generateRegistrationOptions } from '@simplewebauthn/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const rpName = 'My Attendance System';
const rpID = process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  await dbConnect();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userPasskeys = user.passkeys || [];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user._id.toString())),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map(passkey => ({
        id: passkey.credentialID,
        type: 'public-key',
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    await User.findByIdAndUpdate(user._id, { currentChallenge: options.challenge }, { strict: false });

    res.status(200).json(options);
  } catch (error) {
    console.error('Generate Registration Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
