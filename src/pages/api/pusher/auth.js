import Pusher from 'pusher';
import jwt from 'jsonwebtoken';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/dbConnect';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    await dbConnect();
    const { token } = req.cookies;
    if (!token) return res.status(403).end();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('_id name').lean();
        if (!user) return res.status(403).end();

        const socketId = req.body.socket_id;
        const channel = req.body.channel_name;

        const userData = {
            user_id: user._id.toString(),
            user_info: {
                name: user.name,
            }
        };

        const authResponse = pusher.authorizeChannel(socketId, channel, userData);
        res.send(authResponse);
        
    } catch (error) {
        console.error("Pusher Auth Error:", error);
        res.status(500).end();
    }
}