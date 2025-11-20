import api from '../api';

export const getWorkerTasks = async (workerId, status = 'all') => {
  try {
    const response = await api.get(`/api/worker/${workerId}/tasks`, {
      params: { status }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching worker tasks:', error);
    throw error;
  }
};

export const getIncompleteTasks = async (workerId) => {
  try {
    const response = await api.get(`/api/worker/${workerId}/tasks/incomplete`);
    return response.data;
  } catch (error) {
    console.error('Error fetching incomplete tasks:', error);
    throw error;
  }
};

export const submitWork = async (formData) => {
  try {
    const response = await api.post('/api/submissions', formData, {
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
    const response = await api.get(`/api/worker/${workerId}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching submission history:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.put(`/api/tasks/${taskId}/status`, status);
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const getTaskDetails = async (taskId) => {
  try {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task details:', error);
    throw error;
  }
};
