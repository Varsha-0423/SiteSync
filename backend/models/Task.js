const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskName: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  assignedWorkers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  status: {
    type: String,
    enum: ["pending", "on-schedule", "behind", "ahead", "completed"],
    default: "pending"
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isForToday: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
