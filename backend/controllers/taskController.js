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
      supervisor,
      activityId,
      remarks,
      strategy,
      budgetedQuantity,
      prelimsStaffs,
      overheadStaffs,
      material,
      equipment,
      manpower
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
      supervisor,
      activityId: activityId || '',
      remarks: remarks || 'N/A',
      strategy: strategy || '',
      budgetedQuantity: parseFloat(budgetedQuantity) || 0,
      prelimsStaffs: parseFloat(prelimsStaffs) || 0,
      overheadStaffs: parseFloat(overheadStaffs) || 0,
      material: parseFloat(material) || 0,
      equipment: parseFloat(equipment) || 0,
      manpower: parseFloat(manpower) || 0
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
    
    // Parse numeric fields to ensure they're stored as numbers
    const numericFields = [
      'budgetedQuantity',
      'prelimsStaffs',
      'overheadStaffs',
      'material',
      'equipment',
      'manpower'
    ];
    
    numericFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateData[field] = parseFloat(updateData[field]) || 0;
      }
    });
    
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
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    // Count tasks that are behind or overdue as issues
    const issuesTasks = await Task.countDocuments({ 
      $or: [
        { status: 'behind' },
        { status: 'overdue' }
      ]
    });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    
    // Get all tasks with budget data
    const tasks = await Task.find({}, 'prelimsStaffs overheadStaffs material equipment manpower taskName');
    
    // Calculate budget statistics
    let totalBudget = 0;
    let categoryTotals = {
      prelimsStaffs: 0,
      overheadStaffs: 0,
      material: 0,
      equipment: 0,
      manpower: 0
    };
    
    tasks.forEach(task => {
      const taskBudget = (task.prelimsStaffs || 0) + 
                        (task.overheadStaffs || 0) + 
                        (task.material || 0) + 
                        (task.equipment || 0) + 
                        (task.manpower || 0);
      
      totalBudget += taskBudget;
      
      // Sum up each category
      categoryTotals.prelimsStaffs += task.prelimsStaffs || 0;
      categoryTotals.overheadStaffs += task.overheadStaffs || 0;
      categoryTotals.material += task.material || 0;
      categoryTotals.equipment += task.equipment || 0;
      categoryTotals.manpower += task.manpower || 0;
    });
    
    // Find the most expensive task
    const mostExpensiveTask = tasks.reduce((max, task) => {
      const taskBudget = (task.prelimsStaffs || 0) + 
                        (task.overheadStaffs || 0) + 
                        (task.material || 0) + 
                        (task.equipment || 0) + 
                        (task.manpower || 0);
      
      if (taskBudget > (max.budget || 0)) {
        return { name: task.taskName, budget: taskBudget };
      }
      return max;
    }, { name: '', budget: 0 });
    
    // Find the most expensive category
    const mostExpensiveCategory = Object.entries(categoryTotals).reduce(
      (max, [category, amount]) => (amount > (max.amount || 0) ? { category, amount } : max),
      { category: '', amount: 0 }
    );
    
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
        completedTasks,
        issuesTasks,
        pendingTasks,
        userStats,
        budgetStats: {
          totalBudget,
          avgBudgetPerTask: totalBudget / (tasks.length || 1),
          mostExpensiveTask,
          mostExpensiveCategory: {
            name: mostExpensiveCategory.category,
            amount: mostExpensiveCategory.amount
          },
          categoryTotals
        }
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
    
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const getRowValue = (row, ...keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
        const trimmedKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
        if (trimmedKey && row[trimmedKey] !== undefined && row[trimmedKey] !== null && row[trimmedKey] !== '') {
          return row[trimmedKey];
        }
      }
      return '';
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;
      
      try {
        const activityId = getRowValue(row, 'activityId', 'Activity ID');
        const activityName = getRowValue(row, 'activityName', 'Activity Name');
        const startDate = getRowValue(row, 'startDate', 'Start Date');
        const endDate = getRowValue(row, 'endDate', 'End Date');
        const remarks = getRowValue(row, 'remarks', 'Remarks') || 'N/A';
        const strategy = getRowValue(row, 'strategy', 'Strategy');
        
        const budgetedQuantity = Number(getRowValue(row, 'budgetd quantity', 'Budgeted Quantity')) || 0;
        const prelimsStaffs = Number(getRowValue(row, 'prelims staffs', 'Prelims Staffs')) || 0;
        const overheadStaffs = Number(getRowValue(row, 'overhead staffs', 'Overhead Staffs')) || 0;
        const material = Number(getRowValue(row, 'material', 'Material')) || 0;
        const equipment = Number(getRowValue(row, 'equipment', 'Equipment')) || 0;
        const manpower = Number(getRowValue(row, 'manpower', 'Manpower')) || 0;

        const parseExcelDate = (dateStr) => {
          if (!dateStr) return null;
          
          if (typeof dateStr === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            return new Date(excelEpoch.getTime() + dateStr * 86400000);
          }
          
          const excelDateMatch = String(dateStr).match(/^(\d{1,2})-(\w{3})-(\d{2})$/);
          if (excelDateMatch) {
            const [, day, monthStr, yearShort] = excelDateMatch;
            const month = monthMap[monthStr];
            if (month === undefined) {
              throw new Error(`Invalid month: ${monthStr}`);
            }
            const year = 2000 + parseInt(yearShort, 10);
            return new Date(year, month, parseInt(day, 10));
          }
          
          return new Date(dateStr);
        };
        
        const parsedStartDate = parseExcelDate(startDate);
        const parsedEndDate = parseExcelDate(endDate);
        
        if (!parsedStartDate || isNaN(parsedStartDate.getTime())) {
          throw new Error(`Invalid start date: ${startDate}`);
        }
        
        if (!parsedEndDate || isNaN(parsedEndDate.getTime())) {
          throw new Error(`Invalid end date: ${endDate}`);
        }

        const taskData = {
          activityId: activityId || `TASK-${Date.now()}-${i}`,
          taskName: activityName || 'Untitled Task',
          description: activityName || 'No description',
          remarks,
          date: parsedStartDate,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          priority: 'medium',
          status: 'pending',
          strategy,
          budgetedQuantity,
          prelimsStaffs,
          overheadStaffs,
          material,
          equipment,
          manpower,
          createdBy: req.user._id
        };

        const task = await Task.create(taskData);
        createdTasks.push(task);
      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

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
const updateTodayTasks = async (req, res) => {
  try {
    const { taskIds, date, deadline, supervisorId } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ 
        success: false,
        message: 'taskIds is required and must be an array' 
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (taskIds.length > 0) {
        const updateData = {
          isForToday: true,
          ...(date && { startDate: date }),
          ...(deadline && { deadline })
        };
        
        if (supervisorId && mongoose.Types.ObjectId.isValid(supervisorId)) {
          updateData.supervisor = supervisorId;
        }

        await Task.updateMany(
          { _id: { $in: taskIds } },
          { $set: updateData },
          { session, runValidators: true }
        );
      }

      await session.commitTransaction();
      session.endSession();

      const todayTasks = await Task.find({ _id: { $in: taskIds } })
        .populate('supervisor', 'name email')
        .populate('assignedWorkers', 'name email');

      res.json({
        success: true,
        message: `Successfully updated ${taskIds.length} tasks for today`,
        data: todayTasks
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error updating today tasks:', error);
    
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
