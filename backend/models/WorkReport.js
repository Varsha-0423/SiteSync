const mongoose = require("mongoose");

const workReportSchema = new mongoose.Schema({
  worker: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },

  task: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Task",
    required: true 
  },

  status: {
    type: String,
    enum: ["completed", "half-done"],
    required: true
  },

  photoUrl: { type: String },

  updateText: { type: String },

  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("WorkReport", workReportSchema);
