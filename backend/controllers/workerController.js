const Task = require('../models/Task');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get tasks assigned to a worker
 * @route   GET /api/worker/:workerId/tasks
 * @access  Private
 */
exports.getWorkerTasks = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { status = 'all' } = req.query;

    // Validate workerId
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return next(new ErrorResponse('Invalid worker ID', 400));
    }

    // Build query
    let query = { assignedWorkers: workerId };

    // Add status filter if provided and not 'all'
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get tasks with pagination, sorting, and filtering
    const tasks = await Task.find(query)
      .populate('assignedWorkers', 'name email')
      .sort({ date: 1 }) // Sort by date ascending
      .lean();

    // Transform the data to match frontend expectations
    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.taskName,
      description: task.description,
      dueDate: task.date,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      assignedTo: task.assignedWorkers.map(worker => ({
        id: worker._id,
        name: worker.name,
        email: worker.email
      }))
    }));

    res.status(200).json({
      success: true,
      count: formattedTasks.length,
      data: formattedTasks
    });

  } catch (err) {
    console.error('Error in getWorkerTasks:', err);
    next(new ErrorResponse('Server error', 500));
  }
};

/**
 * @desc    Update task status
 * @route   PUT /api/worker/tasks/:taskId/status
 * @access  Private
 */
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id; // Assuming user ID is available from auth middleware

    if (!status) {
      return next(new ErrorResponse('Status is required', 400));
    }

    // Find the task and verify the worker is assigned to it
    const task = await Task.findOne({
      _id: taskId,
      assignedWorkers: userId
    });

    if (!task) {
      return next(new ErrorResponse('Task not found or not authorized', 404));
    }

    // Update task status and progress based on the new status
    task.status = status;
    
    // Update progress based on status
    if (status === 'completed') {
      task.progress = 100;
    } else if (status === 'on-schedule') {
      task.progress = task.progress < 50 ? 50 : task.progress; // Don't decrease progress
    }

    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (err) {
    console.error('Error updating task status:', err);
    next(new ErrorResponse('Error updating task status', 500));
  }
};