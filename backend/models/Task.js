const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  activityId: {
    type: String,
    trim: true
  },
  taskName: { 
    type: String, 
    required: [true, 'Task name is required'],
    trim: true
  },
  taskTitle: { 
    type: String, 
    default: "Untitled Task",
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  date: { 
    type: Date, 
    required: [true, 'Task date is required'] 
  },
  startDate: { 
    type: Date,
    validate: {
      validator: function(value) {
        if (this.endDate && value) {
          return value <= this.endDate;
        }
        return true;
      },
      message: 'Start date must be before or equal to end date'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (this.startDate && value) {
          return value >= this.startDate;
        }
        return true;
      },
      message: 'End date must be after or equal to start date'
    }
  },
  deadline: { 
    type: Date,
    validate: {
      validator: function(value) {
        // Deadline should be after or equal to start date if both exist
        if (this.startDate && value) {
          return value >= this.startDate;
        }
        return true;
      },
      message: 'Deadline must be after or equal to start date'
    }
  },
  priority: {
    type: String,
    enum: {
      values: ["low", "medium", "high"],
      message: 'Priority must be either low, medium, or high'
    },
    default: "medium"
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "on-schedule", "behind", "ahead", "completed"],
      message: 'Invalid status value'
    },
    default: "pending"
  },
  progress: {
    type: Number,
    min: [0, 'Progress cannot be less than 0'],
    max: [100, 'Progress cannot be greater than 100'],
    default: 0
  },
  isForToday: {
    type: Boolean,
    default: false
  },
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator: async function(value) {
        if (!value) return true; // null is allowed
        const User = mongoose.model('User');
        const user = await User.findById(value);
        return user && user.role === 'supervisor';
      },
      message: 'Supervisor must be a valid user with supervisor role'
    }
  },
  assignedWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // validate: {
    //   validator: async function(workers) {
    //     if (!workers || workers.length === 0) return true;
    //     const User = mongoose.model('User');
    //     const users = await User.find({ _id: { $in: workers } });
    //     return users.length === workers.length;
    //   },
    //   message: 'One or more assigned workers are invalid'
    // }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
taskSchema.index({ activityId: 1 });
taskSchema.index({ startDate: 1 });
taskSchema.index({ endDate: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ supervisor: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ isForToday: 1 });
taskSchema.index({ createdBy: 1 });

// Virtual for work reports
taskSchema.virtual('reports', {
  ref: 'WorkReport',
  localField: '_id',
  foreignField: 'task'
});

// Add a pre-save hook to handle any additional logic before saving
taskSchema.pre('save', function(next) {
  // Ensure isForToday is properly set based on the task date
  if (this.isModified('date') || this.isNew) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(this.date);
    taskDate.setHours(0, 0, 0, 0);
    this.isForToday = today.getTime() === taskDate.getTime();
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);