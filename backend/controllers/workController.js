const WorkReport = require("../models/WorkReport");

// Submit work report (for workers)
exports.submitWork = async (req, res) => {
  try {
    const { task, status, updateText, photoUrl } = req.body;
    const worker = req.user.id; // From auth middleware

    const workReport = await WorkReport.create({
      worker,
      task,
      status,
      updateText,
      photoUrl
    });

    res.status(201).json({ success: true, workReport });
  } catch (error) {
    console.error('Error submitting work:', error);
    res.status(500).json({ success: false, message: 'Failed to submit work' });
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