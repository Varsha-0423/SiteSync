import api from '../api';

/**
 * Fetches tasks assigned to a specific worker
 * @param {string} workerId - The ID of the worker
 * @param {string} [status='all'] - Filter tasks by status (all, pending, in-progress, completed)
 * @returns {Promise<Array>} - Array of tasks
 */
export const getWorkerTasks = async (workerId, status = 'all') => {
  if (!workerId) {
    const error = new Error('Worker ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  console.log(`Making API call to: /worker/${workerId}/tasks?status=${status}`);
  
  try {
    console.log('Making API request to:', `/worker/${workerId}/tasks`);
    console.log('With status filter:', status);
    
    const response = await api.get(`/worker/${workerId}/tasks`, {
      params: { status },
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    console.log('API response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      config: {
        url: response.config?.url,
        baseURL: response.config?.baseURL,
        method: response.config?.method,
        params: response.config?.params,
        headers: response.config?.headers
      }
    });
    
    if (response.status >= 400) {
      const error = new Error(response.data?.message || `Failed to fetch tasks: ${response.statusText}`);
      error.response = response;
      error.status = response.status;
      error.details = response.data?.error || response.data;
      throw error;
    }
    
    return response.data?.data || [];
  } catch (error) {
    // Log detailed error information
    const errorDetails = {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error in getWorkerTasks:', errorDetails);
    
    // Enhance the error with more context
    const enhancedError = new Error(error.message || 'Failed to fetch worker tasks');
    enhancedError.name = error.name || 'WorkerServiceError';
    enhancedError.status = error.response?.status;
    enhancedError.details = error.response?.data?.error || error.response?.data?.message;
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      enhancedError.message = 'Session expired. Please log in again.';
      // Optionally trigger logout
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 404) {
      enhancedError.message = 'Worker not found or no tasks available';
    } else if (error.response?.data?.message) {
      enhancedError.message = error.response.data.message;
    }
    
    throw enhancedError;
    
    // The enhanced error is already thrown above
  }
};

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getIncompleteTasks = async (workerId) => {
  try {
    const response = await api.get(`/worker/${workerId}/tasks/incomplete`);
    return response.data;
  } catch (error) {
    console.error('Error fetching incomplete tasks:', error);
    throw error;
  }
};

export const submitWork = async (formData) => {
  try {
    const response = await api.post('/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting work:', error);
    throw error;
  }
};

export const getSubmissionHistory = async (workerId) => {
  try {
    const response = await api.get(`/worker/${workerId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching submission history:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.put(`/tasks/${taskId}/status`, status);
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const getTaskDetails = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task details:', error);
    throw error;
  }
};
