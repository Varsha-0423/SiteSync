import React, { useState, useEffect } from "react";
import api from "../../api";

function SupervisorTaskAssignment() {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTodayTasks();
    fetchWorkers();
  }, []);

  const fetchTodayTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks/supervisor-today');
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching today tasks:', error);
      setMessage('Error fetching today tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/users?role=worker');
      setWorkers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

const handleAssignmentChange = async (taskId, workerIds) => {
  try {
    setLoading(true);
    console.log('1. Starting assignment for task:', taskId, 'with workers:', workerIds);
    
    // Ensure workerIds is an array of strings (user IDs)
    const workerIdsArray = Array.isArray(workerIds) ? workerIds : [workerIds];
    
    // Filter out any invalid or empty values and ensure they're valid MongoDB ObjectId strings
    const validWorkerIds = workerIdsArray
      .map(id => {
        if (typeof id === 'object' && id !== null) {
          return id._id || id;
        }
        return id;
      })
      .filter(id => id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));

    // Get worker names for confirmation
    const selectedWorkers = validWorkerIds
      .map(id => {
        const worker = workers.find(w => w._id === id);
        return worker ? worker.name : `Worker (${id})`;
      })
      .join(', ');

    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to assign this task to: ${selectedWorkers || 'No workers selected'}?`)) {
      console.log('Assignment cancelled by user');
      setLoading(false);
      return;
    }

    console.log('2. Processed worker IDs:', validWorkerIds);
    
    // Update the task with the new worker assignments
    console.log('3. Sending request to update task...');
    const response = await api.put(`/tasks/${taskId}`, { 
      assignedWorkers: validWorkerIds 
    });
    
    console.log('4. Server response:', response.data);
    
    // Update the local state with the updated task
    console.log('5. Updating local state...');
    const updatedTask = response.data.data;
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => 
        task._id === taskId 
          ? { 
              ...task, 
              assignedWorkers: validWorkerIds.map(id => {
                // Return either the existing worker object or create a minimal one with just the ID
                const existingWorker = task.assignedWorkers?.find(w => 
                  (typeof w === 'object' ? w._id : w) === id
                );
                if (existingWorker) return existingWorker;
                
                // If not found in existing workers, find in the workers list
                const worker = workers.find(w => w._id === id);
                return worker || { _id: id, name: `Worker (${id})` };
              })
            }
          : task
      );
      console.log('6. Updated tasks state:', updatedTasks);
      return updatedTasks;
    });
    
    setMessage('Task assignment updated successfully');
    console.log('7. Assignment completed successfully');
    setTimeout(() => setMessage(''), 3000);
  } catch (error) {
    console.error('Error updating task assignment:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    setMessage(error.response?.data?.message || 'Error updating task assignment');
  } finally {
    setLoading(false);
  }
};
  const handleStatusChange = async (taskId, status) => {
    try {
      setLoading(true);
      await api.put(`/tasks/${taskId}`, { status });
      
      // Refresh tasks to show updated status
      await fetchTodayTasks();
      setMessage('Task status updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating task status:', error);
      setMessage('Error updating task status');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#6c757d';
      case 'on-schedule': return '#28a745';
      case 'behind': return '#dc3545';
      case 'ahead': return '#17a2b8';
      case 'completed': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Today's Task Assignment</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Assign today's tasks to available workers. These tasks have been selected by the admin for today's schedule.
      </p>

      {message && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px',
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div>Loading today's tasks...</div>
      ) : tasks.length === 0 ? (
        <div>No tasks assigned for today. Contact admin to select tasks for today.</div>
      ) : (
        <div>
          <h3>Tasks for Today ({tasks.length})</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {tasks.map((task) => (
              <div 
                key={task._id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{task.taskName}</h4>
                    {task.description && (
                      <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                        {task.description}
                      </p>
                    )}
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <span>Date: {new Date(task.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: getPriorityColor(task.priority),
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {task.priority.toUpperCase()}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '12px',
                        backgroundColor: getStatusColor(task.status),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      <option value="pending">PENDING</option>
                      <option value="on-schedule">ON-SCHEDULE</option>
                      <option value="behind">BEHIND</option>
                      <option value="ahead">AHEAD</option>
                      <option value="completed">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                      Assign Workers:
                    </label>
                    <select
                      multiple
                      value={task.assignedWorkers?.map(w => typeof w === 'object' ? w._id : w) || []}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        handleAssignmentChange(task._id, selectedOptions);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        minHeight: '60px',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    >
                      {workers.map((worker) => (
                        <option key={worker._id} value={worker._id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Hold Ctrl/Cmd to select multiple workers
                    </small>
                  </div>

                  <div style={{ minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                      Currently Assigned:
                    </label>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '4px',
                      minHeight: '60px'
                    }}>
                      {task.assignedWorkers && task.assignedWorkers.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {task.assignedWorkers.map((worker, index) => {
                            console.log('Rendering worker:', worker);
                            let workerName = 'Unknown Worker';
                            
                            // Handle different possible formats of worker data
                            if (typeof worker === 'object' && worker !== null) {
                              workerName = worker.name || 'Unnamed Worker';
                            } else if (typeof worker === 'string' && worker.length > 0) {
                              const foundWorker = workers.find(w => w._id === worker);
                              workerName = foundWorker ? foundWorker.name : `Worker (${worker})`;
                            }
                            
                            return (
                              <li key={worker._id || worker || index}>
                                {workerName}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span style={{ color: '#6c757d', fontStyle: 'italic' }}>No workers assigned</span>
                      )}
                      <div style={{ marginTop: '5px', fontSize: '10px', color: '#999' }}>
                        Workers in state: {JSON.stringify(task.assignedWorkers)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorTaskAssignment;
