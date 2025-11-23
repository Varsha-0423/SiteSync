import React, { useState, useEffect } from "react";
import api from "../../api";

function TaskScheduler() {
  const [allTasks, setAllTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [dateError, setDateError] = useState('');
  const [supervisorError, setSupervisorError] = useState('');
  const [tasksError, setTasksError] = useState('');

  useEffect(() => {
    fetchAllTasks();
    fetchTodayTasks();
    fetchSupervisors();
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
      setTodayTasks(response.data.data || []);
      setSelectedTaskIds(response.data.data?.map(task => task._id) || []);
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
    }
  };

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
    setDateError('');
    setSupervisorError('');
    setTasksError('');

    if (!selectedDate) {
      setDateError('Date is required');
      valid = false;
    }
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
        date: selectedDate,
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

      <div style={{ marginBottom: '20px' }}>
        <h3>All Available Tasks ({allTasks.length})</h3>
        {allTasks.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No tasks available. Upload tasks first.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {allTasks.map((task) => (
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
            <p>Select a date and supervisor for the tasks:</p>
            {/* Date and Supervisor selection in a row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label>
                  Date:&nbsp;
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: dateError ? '2px solid red' : '1px solid #ccc'
                    }}
                  />
                </label>
                {dateError && (
                  <div style={{ color: 'red', fontSize: '13px', marginTop: '4px' }}>{dateError}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
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
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '10px' }}>
                Select Tasks to Schedule
              </h4>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: tasksError ? '2px solid red' : '1px solid #eee',
                borderRadius: '6px',
                padding: '10px',
                background: '#fafafa'
              }}>
                {allTasks.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No tasks available.</p>
                ) : (
                  allTasks.map(task => (
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
