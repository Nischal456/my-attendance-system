import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const rpID = process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
const expectedOrigin = process.env.NEXT_PUBLIC_BASE_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { email, response } = req.body;

    if (!email || !response) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const expectedChallenge = user.currentChallenge;
    
    const passkey = user.passkeys.find(pk => pk.credentialID === response.id);

    if (!passkey) {
      return res.status(400).json({ message: 'Face ID not found for this device.' });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credentialID,
          publicKey: new Uint8Array(passkey.credentialPublicKey.buffer),
          counter: passkey.counter,
          transports: passkey.transports,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      await User.findOneAndUpdate(
        { _id: user._id, 'passkeys.credentialID': passkey.credentialID },
        { 
          $set: { 
            'passkeys.$.counter': authenticationInfo.newCounter,
            currentChallenge: null 
          }
        },
        { strict: false }
      );

      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const cookie = serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      res.setHeader('Set-Cookie', cookie);

      return res.status(200).json({ 
        verified: true, 
        user: { name: user.name, role: user.role, avatar: user.avatar } 
      });
    }

    res.status(400).json({ verified: false, error: 'Authentication verification failed' });
  } catch (error) {
    console.error('Verify Auth Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
