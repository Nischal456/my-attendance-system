import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';
import { sendPushNotification } from '../../../../lib/webPush';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
       return res.status(400).json({ message: 'Invalid subscription object' });
    }

    if (!user.pushSubscriptions) {
       user.pushSubscriptions = [];
    }

    const existingSub = user.pushSubscriptions.find(sub => sub.endpoint === subscription.endpoint);
    
    if (!existingSub) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    // Send an immediate "Test/Welcome" notification as soon as they subscribe
    await sendPushNotification(subscription, {
      title: 'Alerts Active! 🎉',
      body: 'Your device is now securely linked to GeckoWorks. You will receive real-time task alerts here.',
      url: '/dashboard',
      icon: '/paw.png'
    }).catch(err => console.error("Welcome Push failed:", err));

    res.status(200).json({ success: true, message: 'Subscription securely added' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
