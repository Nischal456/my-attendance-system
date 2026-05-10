import { verifyRegistrationResponse } from '@simplewebauthn/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const rpID = process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
const expectedOrigin = process.env.NEXT_PUBLIC_BASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const expectedChallenge = user.currentChallenge;
    const body = req.body;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified) {
      const newPasskey = {
        credentialID: registrationInfo.credential.id,
        credentialPublicKey: registrationInfo.credential.publicKey,
        counter: registrationInfo.credential.counter,
        transports: body.response.transports || [],
      };

      await User.findByIdAndUpdate(user._id, {
        $push: { passkeys: newPasskey },
        $set: { currentChallenge: null }
      }, { strict: false });

      return res.status(200).json({ verified: true });
    }

    res.status(400).json({ verified: false, error: 'Registration verification failed' });
  } catch (error) {
    console.error('Verify Registration Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
