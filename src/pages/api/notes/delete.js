import jwt from 'jsonwebtoken';
import dbConnect from '../../../../lib/dbConnect';
import Note from '../../../../models/Note';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();
  await dbConnect();
  try {
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ message: 'Note ID is required.' });
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    if (note.user.toString() !== decoded.userId) return res.status(403).json({ message: 'Forbidden' });
    await Note.findByIdAndDelete(noteId);
    res.status(200).json({ success: true, message: 'Note deleted.' });
  } catch (error) { res.status(500).json({ message: 'Internal Server Error' }) }
}