import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Note from '../../../../models/Note';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  await dbConnect();
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required.' });
    const newNote = new Note({ content, noteDate: new Date(), user: decoded.userId });
    await newNote.save();
    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}