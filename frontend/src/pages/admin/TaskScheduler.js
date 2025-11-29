import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import io from "socket.io-client";

function TaskScheduler() {
  const [allTasks, setAllTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [supervisorError, setSupervisorError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tasksError, setTasksError] = useState('');
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  // Handle work submission updates
  const handleWorkSubmitted = useCallback((data) => {
    console.log('Work submitted event received:', data);
    
    // Update the task in the allTasks state
    setAllTasks(prevTasks => {
      return prevTasks.map(task => {
        if (task._id === data.taskId) {
          // Update the task status to completed if the work was submitted by supervisor
          if (data.workReport.status === 'completed') {
            return { ...task, status: 'completed' };
          }
          // For other statuses, update the task with the new work report
          return {
            ...task,
            workReports: [...(task.workReports || []), data.workReport]
          };
        }
        return task;
      });
    });
    
    // Also update today's tasks if the task is in today's list
    setTodayTasks(prevTodayTasks => {
      return prevTodayTasks.map(task => {
        if (task._id === data.taskId) {
          if (data.workReport.status === 'completed') {
            return { ...task, status: 'completed' };
          }
          return {
            ...task,
            workReports: [...(task.workReports || []), data.workReport]
          };
        }
        return task;
      });
    });
    
    setMessage({
      type: 'success',
      text: `Work submitted for task: ${data.workReport.task}`
    });
  }, []);

  // Set up WebSocket connection
  useEffect(() => {
    // Initialize socket connection with the correct URL
    const socketUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    console.log('Connecting to WebSocket at:', socketUrl);
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket'],
      path: '/socket.io/'
    });
    
    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.connected);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    setSocket(newSocket);

    // Set up event listeners
    newSocket.on('workSubmitted', handleWorkSubmitted);

    // Clean up on unmount
    return () => {
      newSocket.off('workSubmitted', handleWorkSubmitted);
      newSocket.disconnect();
    };
  }, [handleWorkSubmitted]);

  useEffect(() => {
    fetchAllTasks();
    fetchTodayTasks();
    fetchSupervisors();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllTasks();
      fetchTodayTasks();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setAllTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      setMessage('Error fetching tasks');
    }
  };

  const fetchTodayTasks = async () => {
    try {
      const response = await api.get('/tasks/today');
      const todayTasksData = response.data.data || [];
      setTodayTasks(todayTasksData);
      
      // Don't auto-select any tasks on load
      // Only update if we don't have any selected tasks yet (initial mount)
      setSelectedTaskIds(prevIds => {
        // Only update if we're on initial mount (empty array)
        // and there are no selected tasks yet
        if (prevIds.length === 0) {
          return [];
        }
        return prevIds;
      });
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
    }
  };
  // Filter tasks based on selected status
  const filteredTasks = React.useMemo(() => {
    if (!allTasks || !Array.isArray(allTasks)) return [];
    return statusFilter === 'all' 
      ? [...allTasks] 
      : allTasks.filter(task => task.status === statusFilter);
  }, [allTasks, statusFilter]);

  const fetchSupervisors = async () => {
    try {
      // Fetch all users
      const response = await api.get('/users');
      // Filter users with role 'supervisor'
      const supervisorList = (response.data.data || []).filter(user => user.role === 'supervisor');
      setSupervisors(supervisorList);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const handleTaskToggle = (taskId) => {
    setSelectedTaskIds(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleScheduleTasks = async () => {
    setModalOpen(true);
  };

  const handleScheduleConfirm = async () => {
    let valid = true;
    setSupervisorError('');
    setTasksError('');

    if (!selectedSupervisor) {
      setSupervisorError('Supervisor is required');
      valid = false;
    }
    if (selectedTaskIds.length === 0) {
      setTasksError('At least one task must be selected');
      valid = false;
    }
    if (!valid) return;

    try {
      setLoading(true);
      await api.put('/tasks/update-today', {
        taskIds: selectedTaskIds,
        supervisorId: selectedSupervisor
      });
      await fetchTodayTasks();
      setMessage('Tasks scheduled successfully');
      setTimeout(() => setMessage(''), 3000);
      setModalOpen(false);
    } catch (error) {
      console.error('Error scheduling tasks:', error);
      setMessage('Error scheduling tasks');
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
      <h2>Schedule Tasks</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Schedule tasks for specific dates and assign them to supervisors.
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

      <div style={{ marginBottom: '20px' }}>
        <h3>Scheduled Tasks ({todayTasks.length})</h3>
        {todayTasks.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No tasks scheduled yet</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            {todayTasks.map((task) => (
              <span
                key={task._id}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '16px',
                  fontSize: '14px',
                  border: '1px solid #dee2e6'
                }}
              >
                {task.taskName}
              </span>
            ))}
          </div>
        )}
      </div>
{/* ✔️ FILTER BUTTON + TITLE */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3>All Available Tasks ({filteredTasks.length})</h3>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="on-schedule">On-Schedule</option>
          <option value="behind">Behind</option>
          <option value="ahead">Ahead</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div style={{ marginBottom: '20px' }}>
        {loading ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            {statusFilter === 'all' 
              ? 'No tasks available. Upload tasks first.' 
              : `No ${statusFilter} tasks found.`}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredTasks.map((task) => (
              <div 
                key={task._id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: selectedTaskIds.includes(task._id) ? '4px solid #007bff' : '4px solid transparent'
                }}
                onClick={() => handleTaskToggle(task._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task._id)}
                        onChange={() => handleTaskToggle(task._id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <h4 style={{ margin: '0', color: '#333' }}>{task.taskName}</h4>
                    </div>
                    {task.description && (
                      <p style={{ margin: '0 0 10px 30px', color: '#666', fontSize: '14px' }}>
                        {task.description}
                      </p>
                    )}
                    <div style={{ marginLeft: '30px', fontSize: '14px', color: '#666' }}>
                      <span>Date: {new Date(task.date).toLocaleDateString()}</span>
                      {task.assignedWorkers && task.assignedWorkers.length > 0 && (
                        <span style={{ marginLeft: '15px' }}>
                          Assigned: {task.assignedWorkers.map(w => w.name).join(', ')}
                        </span>
                      )}
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
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: getStatusColor(task.status),
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tasks/${task._id}`);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: '#333',
                      marginLeft: 'auto'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {allTasks.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setSelectedTaskIds([])}
            style={{
              padding: '10px 20px',
              border: '1px solid #6c757d',
              backgroundColor: '#fff',
              color: '#6c757d',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Selection
          </button>
          <button
            onClick={handleScheduleTasks}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
            disabled={loading}
          >
            {loading ? 'Scheduling...' : 'Schedule Selected Tasks'}
          </button>
        </div>
      )}

      {/* Modal Popup */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '400px',
            position: 'relative',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            {/* Close Icon */}
            <span
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                fontSize: '22px',
                cursor: 'pointer',
                color: '#888'
              }}
              title="Close"
            >
              &times;
            </span>
            <h3 style={{ marginTop: 0 }}>Schedule Tasks</h3>
            <p>Select a supervisor for the tasks:</p>
            {/* Supervisor selection */}
            <div style={{ marginBottom: '15px' }}>
              <div>
                <label style={{ marginLeft: 'auto' }}>
                  Supervisor:&nbsp;
                  <select
                    value={selectedSupervisor}
                    onChange={e => setSelectedSupervisor(e.target.value)}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: supervisorError ? '2px solid red' : '1px solid #ccc',
                      minWidth: '140px'
                    }}
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map(sup => (
                      <option key={sup._id} value={sup._id}>{sup.name}</option>
                    ))}
                  </select>
                </label>
                {supervisorError && (
                  <div style={{ color: 'red', fontSize: '13px', marginTop: '4px' }}>{supervisorError}</div>
                )}
              </div>
            </div>
            {/* Task selection list */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>Select Tasks to Schedule</h4>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: tasksError ? '2px solid red' : '1px solid #eee',
                borderRadius: '6px',
                padding: '10px',
                background: '#fafafa'
              }}>
                {allTasks.filter(task => selectedTaskIds.includes(task._id)).length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No tasks selected. Please select tasks from the list above.</p>
                ) : (
                  allTasks.filter(task => selectedTaskIds.includes(task._id)).map(task => (
                    <div key={task._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task._id)}
                        onChange={() => handleTaskToggle(task._id)}
                        style={{ marginRight: '10px', cursor: 'pointer' }}
                      />
                      <span style={{
                        fontWeight: selectedTaskIds.includes(task._id) ? 'bold' : 'normal',
                        color: '#333'
                      }}>
                        {task.taskName}
                      </span>
                      <span style={{
                        marginLeft: 'auto',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: getPriorityColor(task.priority),
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {task.priority}
                      </span>
                    </div>
                  ))
                )}

              </div>
              {tasksError && (
                <div style={{ color: 'red', fontSize: '13px', marginTop: '4px' }}>{tasksError}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #6c757d',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={handleScheduleConfirm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskScheduler;