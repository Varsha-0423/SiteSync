const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// @desc    Get tasks assigned to a specific worker
// @route   GET /api/worker/:workerId/tasks
// @access  Private/Worker
exports.getWorkerTasks = async (req, res) => {
  console.log('=== getWorkerTasks START ===');
  const { workerId } = req.params;
  const { status = 'all' } = req.query;
  
  // Log the full request for debugging
  console.log('Fetching tasks for workerId:', workerId, 'status:', status);
  
  try {
    console.log('Request received with params:', { workerId, status });
    
    // Validate workerId format
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      console.error('Invalid workerId format:', workerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID format',
        error: 'INVALID_WORKER_ID',
        workerId
      });
    }
    
    // Check if worker exists
    try {
      const worker = await User.findById(workerId).lean();
      if (!worker) {
        console.error('Worker not found:', workerId);
        return res.status(404).json({
          success: false,
          message: 'Worker not found',
          error: 'WORKER_NOT_FOUND',
          workerId
        });
      }
    } catch (userError) {
      console.error('Error checking worker existence:', userError);
      return res.status(500).json({
        success: false,
        message: 'Error validating worker',
        error: 'WORKER_VALIDATION_ERROR',
        details: process.env.NODE_ENV === 'development' ? userError.message : undefined
      });
    }

    // Check MongoDB connection
    try {
      await mongoose.connection.db.admin().ping();
      console.log('MongoDB connection is active');
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Database connection error',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    // Map frontend status to backend status values
    const statusMap = {
      'in-progress': 'on-schedule',
      'inProgress': 'on-schedule',  // for backward compatibility
      'behind': 'behind',
      'ahead': 'ahead',
      'completed': 'completed',
      'pending': 'pending'
    };

    // Build query - try both worker and assignedWorkers for backward compatibility
    const query = {
      $or: [
        { worker: new mongoose.Types.ObjectId(workerId) },
        { assignedWorkers: { $in: [new mongoose.Types.ObjectId(workerId)] } }
      ]
    };
    
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    
    // Add status filter if provided and not 'all'
    if (status && status !== 'all') {
      // Use the mapped status or fall back to the provided status
      const mappedStatus = statusMap[status] || status;
      query.status = mappedStatus;
      console.log('Filtering by status:', mappedStatus);
    }
    
    console.log('Executing query:', JSON.stringify(query, null, 2));
    
    // Execute query with error handling
    let tasks = [];
    try {
      console.log('Executing MongoDB query...');
      
      // Execute the query with better error handling
      tasks = await Task.find(query)
        .sort({ date: 1, priority: 1 })
        .populate('assignedBy', 'name')
        .populate('assignedWorkers', 'name email')
        .lean()
        .exec();
        
      console.log(`Found ${tasks.length} tasks for worker ${workerId}`);

      return res.json({
        success: true,
        count: tasks.length,
        data: tasks
      });
      
    } catch (queryError) {
      console.error('Query execution error:', {
        name: queryError.name,
        message: queryError.message,
        stack: queryError.stack
      });
      throw new Error('Error executing database query');
    }
    
  } catch (error) {
    console.error('Error in getWorkerTasks:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      errorType: error.name,
      errorCode: error.code,
      errorKey: error.keyValue,
      errorErrors: error.errors
    });
    
    // Make sure to return a proper error response
    return res.status(500).json({ 
      success: false,
      message: 'Server error fetching worker tasks',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        code: error.code,
        keyValue: error.keyValue,
        errors: error.errors
      } : undefined
    });
  } finally {
    console.log('=== getWorkerTasks END ===');
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private/Admin/Supervisor
exports.getTasks = async (req, res) => {
  try {
    const { status, assignedWorker, date } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (assignedWorker) filter.assignedWorkers = assignedWorker;
    
    // Add date filtering - filter tasks for specific date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const tasks = await Task.find(filter)
      .populate('assignedWorkers', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

// @desc    Create a new task (Admin only)
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res) => {
  try {
    const { taskName, description, date, assignedWorkers, priority, status, isForToday } = req.body;

    const task = await Task.create({
      taskName,
      description,
      date,
      assignedWorkers,
      priority: priority || 'medium',
      status: status || 'pending',
      isForToday: isForToday || false
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedWorkers', 'name email');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private/Admin/Supervisor
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedWorkers', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error fetching task' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private/Admin/Supervisor
exports.updateTask = async (req, res) => {
  try {
    console.log('Updating task with ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Create a copy of the request body to modify
    const updateData = { ...req.body };
    
    // Handle assignedWorkers if it exists in the request
    if (updateData.assignedWorkers) {
      // Ensure assignedWorkers is an array
      const workerIds = Array.isArray(updateData.assignedWorkers) 
        ? updateData.assignedWorkers 
        : [updateData.assignedWorkers];
      
      // Filter out any invalid values and ensure they're strings
      updateData.assignedWorkers = workerIds
        .map(id => {
          // If it's an object, try to get the _id, otherwise use the value directly
          if (typeof id === 'object' && id !== null) {
            return id._id || id;
          }
          return id;
        })
        .filter(id => id && typeof id === 'string' && id.length > 0);
    }
    
    console.log('Processed update data:', updateData);
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, runSettersOnQuery: true }
    ).populate('assignedWorkers', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    
    // Enhanced error handling for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Handle cast errors (e.g., invalid ObjectId)
    if (error.name === 'CastError') {
      console.error('Cast error - invalid ID or data format:', error);
      return res.status(400).json({ 
        message: 'Invalid data format', 
        field: error.path,
        value: error.value 
      });
    }
    
    res.status(500).json({ message: 'Server error updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/tasks/dashboard-stats
// @access  Private/Admin/Supervisor
exports.getDashboardStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const onScheduleTasks = await Task.countDocuments({ status: 'on-schedule' });
    const behindTasks = await Task.countDocuments({ status: 'behind' });
    const aheadTasks = await Task.countDocuments({ status: 'ahead' });
    
    const users = await User.find({ role: 'worker' }).select('name');
    const userStats = await Promise.all(
      users.map(async (user) => {
        const userTaskCount = await Task.countDocuments({ assignedWorkers: user._id });
        return {
          user: user.name,
          totalTasks: userTaskCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalTasks,
        onScheduleTasks,
        behindTasks,
        aheadTasks,
        userStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// @desc    Upload Excel file and create tasks
// @route   POST /api/tasks/upload-excel
// @access  Private/Admin
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const createdTasks = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Map Excel columns to task fields
        const taskData = {
          taskName: row['Task Name'] || row['taskName'] || row['Task'] || `Task ${i + 1}`,
          description: row['Description'] || row['description'] || '',
          date: row['Date'] || row['date'] || new Date(),
          priority: row['Priority'] || row['priority'] || 'medium',
          status: row['Status'] || row['status'] || 'pending',
          assignedWorkers: []
        };

        // Handle assigned workers if present
        if (row['Assigned Workers'] || row['assignedWorkers'] || row['Worker']) {
          const workerNames = (row['Assigned Workers'] || row['assignedWorkers'] || row['Worker']).toString().split(',').map(w => w.trim());
          const workers = await User.find({ name: { $in: workerNames }, role: 'worker' });
          taskData.assignedWorkers = workers.map(w => w._id);
        }

        const task = await Task.create(taskData);
        const populatedTask = await Task.findById(task._id).populate('assignedWorkers', 'name email');
        createdTasks.push(populatedTask);
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdTasks.length} tasks`,
      data: createdTasks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading Excel:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error processing Excel file' });
  }
};

// @desc    Get tasks marked for today (Admin only)
// @route   GET /api/tasks/today
// @access  Private/Admin
exports.getTodayTasks = async (req, res) => {
  try {
    // Get tasks marked for today, handle cases where field might not exist
    const tasks = await Task.find({ isForToday: true })
      .populate('assignedWorkers', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    res.status(500).json({ message: 'Server error fetching today tasks' });
  }
};

// @desc    Get tasks for supervisor to assign (only tasks marked for today)
// @route   GET /api/tasks/supervisor-today
// @access  Private/Supervisor
exports.getSupervisorTodayTasks = async (req, res) => {
  try {
    // Get tasks marked for today for supervisor assignment
    const tasks = await Task.find({ isForToday: true })
      .populate('assignedWorkers', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching supervisor today tasks:', error);
    res.status(500).json({ message: 'Server error fetching supervisor today tasks' });
  }
};

// @desc    Update which tasks are marked for today (Admin only)
// @route   PUT /api/tasks/update-today
// @access  Private/Admin
exports.updateTodayTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;
    
    // Validate taskIds parameter
    if (!taskIds) {
      return res.status(400).json({ 
        message: 'taskIds is required in request body',
        received: req.body 
      });
    }
    
    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ 
        message: 'taskIds must be an array',
        received: typeof taskIds 
      });
    }
    
    console.log('Updating today tasks with IDs:', taskIds);
    
    // First, remove isForToday flag from all tasks
    await Task.updateMany({}, { isForToday: false });
    
    // Then, set isForToday flag for selected tasks
    if (taskIds && taskIds.length > 0) {
      // Convert string IDs to ObjectId for proper MongoDB querying
      const mongoose = require('mongoose');
      const objectIds = taskIds.map(id => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid ObjectId format: ${id}`);
        }
        return new mongoose.Types.ObjectId(id);
      });
      
      await Task.updateMany(
        { _id: { $in: objectIds } },
        { isForToday: true }
      );
    }

    const updatedTasks = await Task.find({ isForToday: true })
      .populate('assignedWorkers', 'name email');

    res.json({
      success: true,
      message: `Updated ${taskIds ? taskIds.length : 0} tasks for today`,
      data: updatedTasks
    });
  } catch (error) {
    console.error('Error updating today tasks:', error);
    
    // Enhanced error handling for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Handle cast errors (e.g., invalid ObjectId)
    if (error.name === 'CastError') {
      console.error('Cast error - invalid ID or data format:', error);
      return res.status(400).json({ 
        message: 'Invalid data format', 
        field: error.path,
        value: error.value 
      });
    }
    
    // Handle custom ObjectId validation errors
    if (error.message && error.message.includes('Invalid ObjectId format')) {
      console.error('Invalid ObjectId error:', error);
      return res.status(400).json({ 
        message: 'Invalid task ID format', 
        details: error.message 
      });
    }
    
    res.status(500).json({ message: 'Server error updating today tasks' });
  }
};