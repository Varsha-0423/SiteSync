const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// @desc    Get tasks assigned to a specific worker
// @route   GET /api/worker/:workerId/tasks
// @access  Private/Worker
const getWorkerTasks = async (req, res) => {
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
const getTasks = async (req, res) => {
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
const createTask = async (req, res) => {
  try {
    const { 
      taskName, 
      taskTitle, 
      description, 
      date, 
      startDate, 
      deadline,
      assignedWorkers, 
      priority, 
      status, 
      isForToday, 
      supervisor 
    } = req.body;

    const task = await Task.create({
      taskName,
      taskTitle,
      description,
      date,
      startDate,
      deadline,
      assignedWorkers,
      priority: priority || 'medium',
      status: status || 'pending',
      isForToday: isForToday || false,
      supervisor
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private/Admin/Supervisor
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

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
const updateTask = async (req, res) => {
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
      { new: true, runValidators: false }
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
const deleteTask = async (req, res) => {
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
const getDashboardStats = async (req, res) => {
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
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching dashboard statistics' 
    });
  }
};
// @route   POST /api/tasks/upload-excel
// @access  Private/Admin
const uploadExcel = async (req, res) => {
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
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const createdTasks = [];
    const errors = [];
    const validPriorities = ['low', 'medium', 'high'];
    
    // Month name to number mapping
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because Excel is 1-indexed and we have a header row
      
      try {
        // Map Excel columns to task fields
        const activityId = row['Substation - Activity ID'] || '';
        const activityName = row['Activity Name'] || '';
        const duration = row['Duration'] || '';
        const revisedStart = row['Revised Start'] || '';
        const revisedFinish = row['Revised Finish'] || '';
        const remarks = row['Remarks'] || '';
        
        // Check required fields
        if (!activityId || !activityName || !revisedStart || !revisedFinish) {
          throw new Error('Missing required fields. Ensure all columns are filled.');
        }

        // Parse dates from DD-Mon-YY format (e.g., 25-Oct-25)
        const parseExcelDate = (dateStr) => {
          if (!dateStr) return null;
          
          // Handle DD-Mon-YY format (e.g., 25-Oct-25)
          const excelDateMatch = String(dateStr).match(/^(\d{1,2})-(\w{3})-(\d{2})$/);
          if (excelDateMatch) {
            const [, day, monthStr, yearShort] = excelDateMatch;
            const month = monthMap[monthStr];
            const year = 2000 + parseInt(yearShort, 10); // Convert YY to YYYY
            return new Date(year, month, parseInt(day, 10));
          }
          
          // Fallback for other date formats if needed
          return new Date(dateStr) || null;
        };
        
        // Set default priority to medium
        const priority = 'medium';
        
        // Parse dates
        const startDate = parseExcelDate(revisedStart);
        const endDate = parseExcelDate(revisedFinish);
        
        if (!startDate || isNaN(startDate.getTime())) {
          throw new Error(`Invalid start date format: ${revisedStart}. Expected DD-Mon-YY (e.g., 25-Oct-25)`);
        }
        
        if (!endDate || isNaN(endDate.getTime())) {
          throw new Error(`Invalid end date format: ${revisedFinish}. Expected DD-Mon-YY (e.g., 25-Oct-25)`);
        }
        
        // Validate that endDate is not before startDate
        if (endDate < startDate) {
          throw new Error(`End date (${revisedFinish}) cannot be before start date (${revisedStart})`);
        }

        // Prepare task data
        const taskData = {
          activityId,
          taskName: activityName,
          description: activityName, // Using activity name as description
          duration,
          remarks,
          date: startDate, // Using start date as the task date
          startDate,
          endDate,
          priority,
          status: 'pending',
          createdBy: req.user._id
        };

        const task = await Task.create(taskData);
        createdTasks.push(task);
      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    const response = {
      success: true,
      message: `Successfully created ${createdTasks.length} out of ${data.length} tasks`,
      createdCount: createdTasks.length,
      totalCount: data.length,
      data: createdTasks
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.errorCount = errors.length;
    }

    res.status(201).json(response);
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
const getTodayTasks = async (req, res) => {
  try {
    // Get tasks marked for today, handle cases where field might not exist
    const tasks = await Task.find({ isForToday: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching today\'s tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tasks for supervisor to assign (only tasks marked for today)
// @route   GET /api/tasks/supervisor-today
// @access  Private/Supervisor
const getSupervisorTodayTasks = async (req, res) => {
  try {
    // Get tasks marked for today for supervisor assignment
    const tasks = await Task.find({ isForToday: true })
      .populate('assignedWorkers', 'name email')
      .sort({ createdAt: -1 });

    console.log('Supervisor tasks with deadlineDate:', tasks.map(t => ({ id: t._id, deadlineDate: t.deadlineDate })));

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
const updateTodayTasks = async (req, res) => {
  try {
    const { taskIds, date, deadline, supervisorId } = req.body;
    console.log('updateTodayTasks received:', { taskIds, date, deadline, supervisorId, fullBody: req.body });
    
    // Validate required fields
    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ 
        success: false,
        message: 'taskIds is required and must be an array' 
      });
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. First, reset all tasks to not be for today
      await Task.updateMany(
        {},
        { $set: { isForToday: false } },
        { session }
      );

      // 2. Update the selected tasks to be for today
      if (taskIds.length > 0) {
        // Ensure supervisorId is a valid ObjectId if provided
        const updateData = {
          isForToday: true,
          ...(date && { startDate: date }),
          ...(deadline && { deadline })
        };
        
        // Only add supervisor if it's a valid ID
        if (supervisorId && mongoose.Types.ObjectId.isValid(supervisorId)) {
          updateData.supervisor = supervisorId;
        }

        await Task.updateMany(
          { _id: { $in: taskIds } },
          { $set: updateData },
          { session, runValidators: true }
        );
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // 3. Get the updated list of today's tasks
      const todayTasks = await Task.find({ _id: { $in: taskIds } })
        .populate('supervisor', 'name email')
        .populate('assignedWorkers', 'name email');

      res.json({
        success: true,
        message: `Successfully updated ${taskIds.length} tasks for today`,
        data: todayTasks
      });

    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw error; // This will be caught by the outer catch block
    }

  } catch (error) {
    console.error('Error updating today tasks:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        field: error.path,
        value: error.value
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating today tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all functions
module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
  uploadExcel,
  getTodayTasks,
  getSupervisorTodayTasks,
  updateTodayTasks
};