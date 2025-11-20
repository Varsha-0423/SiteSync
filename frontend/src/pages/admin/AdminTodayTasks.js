import React, { useState, useEffect } from "react";
import api from "../../api";

function AdminTodayTasks() {
  const [allTasks, setAllTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAllTasks();
    fetchTodayTasks();
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
      console.error('Error fetching today tasks:', error);
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

  const handleUpdateTodayTasks = async () => {
    try {
      setLoading(true);
      await api.put('/tasks/update-today', { taskIds: selectedTaskIds });
      
      await fetchTodayTasks();
      setMessage('Today\'s tasks updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating today tasks:', error);
      setMessage('Error updating today tasks');
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
      <h2>Select Today's Tasks</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Choose which tasks should be available for supervisors to assign to workers today.
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
        <h3>Current Today's Tasks ({todayTasks.length})</h3>
        {todayTasks.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No tasks selected for today</p>
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
            onClick={handleUpdateTodayTasks}
            disabled={loading}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Updating...' : `Update Today's Tasks (${selectedTaskIds.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminTodayTasks;
