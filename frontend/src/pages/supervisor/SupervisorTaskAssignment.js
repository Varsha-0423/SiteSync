import React, { useState, useEffect } from "react"; 
import api from "../../api";
import { useNavigate } from "react-router-dom";
import WorkerSubmit from "./WorkerSubmit";

function SupervisorTaskAssignment() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showWorkerSubmit, setShowWorkerSubmit] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tempSelections, setTempSelections] = useState({}); // Track temporary selections per task
  const [workerSearchTerms, setWorkerSearchTerms] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [allTasks, setAllTasks] = useState([]);

  useEffect(() => {
    fetchTodayTasks();
    fetchWorkers();
  }, []);

  const checkAndUpdateTaskStatus = async (tasks) => {
    const now = new Date();
    return tasks.map(task => {
      if (task.status === 'completed' || task.status === 'overdue' || !task.endDate) {
        return task;
      }
      const endDate = new Date(task.endDate);
      if (now > endDate) {
        return { ...task, status: 'overdue' };
      }
      return task;
    });
  };

  const fetchTodayTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks/supervisor-today");
      const tasksData = response.data.data || [];
      const updatedTasks = await checkAndUpdateTaskStatus(tasksData);
      setAllTasks(Array.isArray(updatedTasks) ? updatedTasks : []);
      setTasks(Array.isArray(updatedTasks) ? updatedTasks : []);
      setTempSelections({});
    } catch (error) {
      console.error("Error fetching today tasks:", error);
      setMessage("Error fetching today tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await api.get("/users?role=worker");
      setWorkers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      setMessage('Error loading workers');
    }
  };

  const handleWorkerToggle = (taskId, workerId) => {
    setTempSelections(prev => {
      const currentTask = tasks.find(t => t._id === taskId);
      const currentWorkerIds = (currentTask?.assignedWorkers || [])
        .map(w => typeof w === "object" && w._id ? w._id : w)
        .filter(id => id && typeof id === 'string');
      
      const taskSelections = prev[taskId] || currentWorkerIds;
      const newSelections = taskSelections.includes(workerId)
        ? taskSelections.filter(id => id !== workerId)
        : [...taskSelections, workerId];
      
      return { ...prev, [taskId]: newSelections };
    });
  };

  const handleAssignWorkers = async (taskId) => {
    const newWorkerIds = tempSelections[taskId];
    if (!newWorkerIds) return;

    const currentTask = tasks.find(t => t._id === taskId);
    const currentWorkerIds = (currentTask?.assignedWorkers || [])
      .map(w => typeof w === "object" && w._id ? w._id : w)
      .filter(id => id && typeof id === 'string');

    const addedWorkers = newWorkerIds.filter(id => !currentWorkerIds.includes(id));
    const removedWorkers = currentWorkerIds.filter(id => !newWorkerIds.includes(id));

    if (addedWorkers.length === 0 && removedWorkers.length === 0) {
      setTempSelections(prev => {
        const { [taskId]: _, ...rest } = prev;
        return rest;
      });
      return;
    }

    const getWorkerNames = (ids) => {
  if (workers.length === 0) return ids.map(() => 'Worker').join(', ');
  return ids.map(id => workers.find(w => w.id === id)?.name || 'Worker').join(', ');
};


    let confirmMessage = '';
    if (addedWorkers.length > 0 && removedWorkers.length === 0) {
      confirmMessage = `Assign ${getWorkerNames(addedWorkers)} to this task?`;
    } else if (removedWorkers.length > 0 && addedWorkers.length === 0) {
      confirmMessage = `Unassign ${getWorkerNames(removedWorkers)} from this task?`;
    } else {
      confirmMessage = `Update worker assignments?\n\nAdding: ${getWorkerNames(addedWorkers)}\nRemoving: ${getWorkerNames(removedWorkers)}`;
    }

    if (!window.confirm(confirmMessage)) {
      setTempSelections(prev => {
        const { [taskId]: _, ...rest } = prev;
        return rest;
      });
      return;
    }

    try {
      setLoading(true);
      await api.put(`/tasks/${taskId}`, { assignedWorkers: newWorkerIds });
      await fetchTodayTasks();
      setMessage('Workers assigned successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating workers');
      await fetchTodayTasks();
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { high: "#dc3545", medium: "#ffc107", low: "#28a745" };
    return colors[priority] || "#6c757d";
  };

  const getStatusColor = (status) => {
    const colors = { pending: "#6c757d", "on-schedule": "#28a745", behind: "#dc3545", ahead: "#17a2b8", completed: "#28a745" };
    return colors[status] || "#6c757d";
  };

  const openWorkerSubmit = (task) => {
    setSelectedTask(task);
    setShowWorkerSubmit(true);
  };

  const closeWorkerSubmit = () => {
    setShowWorkerSubmit(false);
    setSelectedTask(null);
  };

  const updateTaskStatus = (taskId, status) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === taskId ? { ...task, status: status.toLowerCase() } : task
      )
    );
  };

  const getSelectedWorkers = (taskId) => {
    if (tempSelections[taskId]) {
      return tempSelections[taskId];
    }
    const task = tasks.find(t => t._id === taskId);
    return (task?.assignedWorkers || [])
      .map(w => typeof w === "object" && w._id ? w._id : w)
      .filter(id => id && typeof id === 'string');
  };

  const hasChanges = (taskId) => {
    if (!tempSelections[taskId]) return false;
    const currentTask = tasks.find(t => t._id === taskId);
    const currentWorkerIds = (currentTask?.assignedWorkers || [])
      .map(w => typeof w === "object" && w._id ? w._id : w)
      .filter(id => id && typeof id === 'string');
    const tempIds = tempSelections[taskId];
    return JSON.stringify([...currentWorkerIds].sort()) !== JSON.stringify([...tempIds].sort());
  };

  const handleDateFilter = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (!date) {
      setTasks(allTasks);
      return;
    }
    
    const filterDate = new Date(date);
    const filtered = allTasks.filter(task => {
      if (!task.startDate || !task.endDate) return false;
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      return filterDate >= start && filterDate <= end;
    });
    
    setTasks(filtered);
  };

  return (
    <div style={{ padding: "20px", position: 'relative' }}>
      {showWorkerSubmit && selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
            width: '80%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '15px' }}>
              <button onClick={closeWorkerSubmit} style={{
                background: 'none', border: 'none', fontSize: '20px',
                cursor: 'pointer', color: '#666'
              }}>×</button>
            </div>
            <WorkerSubmit task={selectedTask._id} taskName={selectedTask.taskName} onClose={closeWorkerSubmit} onWorkSubmitted={updateTaskStatus} />
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>Today's Task Assignment</h2>
          <p style={{ color: "#666", margin: 0 }}>
            Select workers for each task and click "Assign Workers" to confirm.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '20px' }}>📅</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateFilter}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {message && (
        <div style={{
          marginBottom: "20px", padding: "10px",
          backgroundColor: message.includes("Error") ? "#f8d7da" : "#d4edda",
          color: message.includes("Error") ? "#721c24" : "#155724",
          borderRadius: "4px"
        }}>{message}</div>
      )}

      {loading && tasks.length === 0 ? (
        <div>Loading today's tasks...</div>
      ) : tasks.length === 0 ? (
        <div>No tasks assigned for today.</div>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {tasks.map((task) => {
            const selectedWorkers = getSelectedWorkers(task._id);
            const showAssignButton = hasChanges(task._id);
            
            return (
              <div key={task._id} style={{
                border: "1px solid #ddd", borderRadius: "8px", padding: "15px",
                backgroundColor: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 5px 0" }}>{task.taskName}</h4>
                    <p style={{ margin: "0 0 8px 0", color: "#666" }}>{task.description}</p>
                    <div style={{ fontSize: '13px', color: '#555' }}>
                      <span> Start: {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'}</span>
                      <span style={{ marginLeft: '15px' }}> End: {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ marginBottom: "10px" }}>
                      <span 
                        style={{
                          color: getStatusColor(task.status),
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: `${getStatusColor(task.status)}20`,
                          display: 'inline-block',
                          minWidth: '80px',
                          textAlign: 'center'
                        }}
                      >
                        {task.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <label style={{ fontWeight: "bold" }}>
                      Select Workers:
                    </label>
                    <input
                      type="text"
                      placeholder="Search workers..."
                      value={workerSearchTerms[task._id] || ''}
                      onChange={(e) => setWorkerSearchTerms(prev => ({ ...prev, [task._id]: e.target.value }))}
                      style={{
                        width: '250px', padding: '6px 10px',
                        border: '1px solid #ddd', borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{
                    maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd',
                    borderRadius: '4px', padding: '10px', backgroundColor: '#f8f9fa'
                  }}>
                    {workers
                      .filter(worker => {
                        const searchTerm = workerSearchTerms[task._id] || '';
                        return worker.name.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((worker) => {
                        const workerId = worker._id || worker.id;
                        if (!workerId) return null;
                        const isSelected = selectedWorkers.includes(workerId);
                        
                        return (
                          <div key={workerId} style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleWorkerToggle(task._id, workerId)}
                                style={{ marginRight: '8px' }}
                              />
                              <span>{worker.name}</span>
                            </label>
                          </div>
                        );
                      })}
                  </div>
                  
                  <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#e7f3ff', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Currently Assigned ({task.assignedWorkers?.length || 0}):</strong>
                      {task.assignedWorkers?.length ? (
                        <div style={{ marginTop: '5px' }}>
                          {task.assignedWorkers.map((worker, index) => {
                            const workerName = typeof worker === "object" && worker.name
                              ? worker.name
                              : workers.find((w) => String(w._id) === String(worker))?.name || "Unknown";
                            return (
                              <span key={index} style={{
                                display: 'inline-block', backgroundColor: '#007bff', color: 'white',
                                padding: '4px 8px', borderRadius: '12px', marginRight: '5px',
                                marginTop: '5px', fontSize: '13px'
                              }}>{workerName}</span>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#666' }}> None</span>
                      )}
                    </div>
                    {showAssignButton && (
                      <button
                        onClick={() => handleAssignWorkers(task._id)}
                        disabled={loading}
                        style={{
                          padding: "8px 16px", backgroundColor: "#28a745", color: "white",
                          border: "none", borderRadius: "5px", cursor: "pointer",
                          fontWeight: "bold", fontSize: "14px"
                        }}
                      >
                        Assign Workers
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openWorkerSubmit(task)}
                  style={{
                    padding: "10px 16px", backgroundColor: "#007bff", color: "white",
                    border: "none", borderRadius: "5px", cursor: "pointer",
                    width: "200px", display: "block", margin: "15px auto 0 auto", fontWeight: "bold"
                  }}
                >
                  Submit Work
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SupervisorTaskAssignment;
