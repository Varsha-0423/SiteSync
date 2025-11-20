import React, { useState, useEffect } from "react";
import api from "../../api";

function TaskAssignment() {
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTasks();
    fetchWorkers();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks/today');
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setMessage('Error fetching tasks');
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
      await api.put(`/tasks/${taskId}`, { assignedWorkers: workerIds });
      
      // Refresh tasks to show updated assignments
      await fetchTasks();
      setMessage('Task assignment updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating task assignment:', error);
      setMessage('Error updating task assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      setLoading(true);
      await api.put(`/tasks/${taskId}`, { status });
      
      // Refresh tasks to show updated status
      await fetchTasks();
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
      <h2>Task Assignment - Today's Tasks</h2>

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
        <div>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div>No tasks found for today. Please select tasks in "Today's Tasks" page first.</div>
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
                      value={task.assignedWorkers?.map(w => w._id) || []}
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
                      minHeight: '60px',
                      fontSize: '14px'
                    }}>
                      {task.assignedWorkers && task.assignedWorkers.length > 0 ? (
                        <div>
                          {task.assignedWorkers.map((worker) => (
                            <div key={worker._id} style={{ marginBottom: '2px' }}>
                              • {worker.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>No workers assigned</span>
                      )}
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

export default TaskAssignment;
