import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    // The main title of the task
    title: {
      type: String,
      required: [true, 'Please provide a title for the task.'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },

    // A more detailed description of the task (optional)
    description: {
      type: String,
      trim: true,
    },

    // The current status of the task
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Completed'],
      default: 'To Do',
    },

    // A reference to the employee the task is assigned to
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // A reference to the Project Manager who assigned the task
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    deadline: {
      type: Date,
      required: false, // Make it optional, not all tasks may have a hard deadline
    },

    // A specific timestamp for when the task was marked as 'Completed'
    completedAt: {
      type: Date,
    },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamps
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);