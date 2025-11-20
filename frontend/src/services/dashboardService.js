import api from '../api';

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/tasks/dashboard-stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Get all tasks with optional filters
export const getTasks = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedWorker) params.append('assignedWorker', filters.assignedWorker);
    
    const response = await api.get(`/tasks?${params}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Get single task by ID
export const getTaskById = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

// Create new task
export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update task
export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Delete task
export const deleteTask = async (id) => {
  try {
    await api.delete(`/tasks/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    const response = await api.get(`/users/role/${role}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};
