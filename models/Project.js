import mongoose from 'mongoose';

// 1. Define Task Schema
const TaskSchema = new mongoose.Schema({
  content: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// 2. ✅ NEW: Define Comment Schema (This was missing!)
const CommentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// 3. Update Project Schema
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  tasks: [TaskSchema], 
  
  // ✅ ADD THIS: The field the API was trying to populate
  comments: [CommentSchema], 
  
  status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);