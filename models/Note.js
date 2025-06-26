// models/Note.js
import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Note content cannot be empty.'],
    trim: true,
  },
  // The date this note pertains to, for daily organization
  noteDate: {
    type: Date,
    required: true,
  },
  // Link to the user who owns this note
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true }); // Adds createdAt and updatedAt

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);