import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the task.'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Completed'],
      default: 'To Do',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
     assistedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deadline: {
      type: Date,
      required: false,
    },
    // --- NEW FIELDS ---
    startTime: {
      type: String, // Storing as a string like "10:30"
    },
    endTime: {
      type: String, // Storing as a string like "17:00"
    },
    completedAt: {
      type: Date,
    },
    attachments: [AttachmentSchema],
    submissionDescription: {
      type: String,
      trim: true,
    },
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);