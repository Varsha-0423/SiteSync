const WorkReport = require("../models/WorkReport");
const { io } = require('../server');

// Submit work report (for workers)
exports.submitWork = async (req, res) => {
  try {
    const { worker, task, status, quantity, unit, updateText, photoUrl, photoUrls } = req.body;

    if (!worker || !task || !status) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const workReport = await WorkReport.create({
      worker,
      task,
      status,
      quantity,
      unit,
      updateText,
      photoUrl,
      photoUrls
    });

    // Emit WebSocket event to notify all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('workSubmitted', { 
        taskId: workReport.task,
        workReport,
        message: 'New work submission received',
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: "Work submitted successfully",
      workReport
    });

  } catch (error) {
    console.error("Error submitting work:", error);
    res.status(500).json({ success: false, message: "Failed to submit work" });
  }
};
// Get all work reports for a specific task
exports.getReportsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const reports = await WorkReport.find({ task: taskId })
      .populate('worker', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching work reports by task:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports for this task' });
  }
};


// Get work reports (for workers - only their own reports)
exports.getMyReports = async (req, res) => {
  try {
    const reports = await WorkReport.find({ worker: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching work reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch work reports' });
  }
};

// Get all work reports (admin/supervisor only)
exports.getAllReports = async (req, res) => {
  try {
    // Only admin and supervisor can access all reports
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const reports = await WorkReport.find()
      .populate('worker', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching all work reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch work reports' });
  }
};