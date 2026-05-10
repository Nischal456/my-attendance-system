import { generateAuthenticationOptions } from '@simplewebauthn/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const rpID = process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userPasskeys = user.passkeys || [];

    if (userPasskeys.length === 0) {
      return res.status(400).json({ message: 'No Face ID registered. Please login with password to set it up.' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userPasskeys.map(passkey => ({
        id: passkey.credentialID,
        type: 'public-key',
        transports: passkey.transports,
      })),
      userVerification: 'preferred',
    });

    await User.findByIdAndUpdate(user._id, { currentChallenge: options.challenge }, { strict: false });

    res.status(200).json(options);
  } catch (error) {
    console.error('Auth Options Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
