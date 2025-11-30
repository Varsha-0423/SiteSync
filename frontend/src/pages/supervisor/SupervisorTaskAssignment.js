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

  useEffect(() => {
    fetchTodayTasks();
    fetchWorkers();
  }, []);

  const updateTaskStatusOnServer = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
    } catch (error) {
      console.error(`Error updating task status for ${taskId}:`, error);
      // We'll still update the UI even if server update fails
    }
  };

  const checkAndUpdateTaskStatus = async (tasks) => {
    const now = new Date();
    const updatedTasks = [];
    
    for (const task of tasks) {
      // Skip if task is already completed, overdue, or doesn't have an end date
      if (task.status === 'completed' || task.status === 'overdue' || !task.endDate) {
        updatedTasks.push(task);
        continue;
      }
      
      const endDate = new Date(task.endDate);
      // If current date is past the end date, mark as overdue
      if (now > endDate) {
        const updatedTask = { ...task, status: 'overdue' };
        updatedTasks.push(updatedTask);
        // Update status on server in the background
        updateTaskStatusOnServer(task._id, 'overdue');
      } else {
        updatedTasks.push(task);
      }
    }
    
    return updatedTasks;
  };

  const fetchTodayTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks/supervisor-today");
      const tasksData = response.data.data || [];
      // Update task statuses based on end date before setting state
      const updatedTasks = await checkAndUpdateTaskStatus(tasksData);
      setTasks(Array.isArray(updatedTasks) ? updatedTasks : []);
    } catch (error) {
      console.error("Error fetching today tasks:", error);
      setMessage("Error fetching today tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      console.log('Fetching workers...');
      const response = await api.get("/users?role=worker");
      const workersData = response.data.data || [];
      
      if (workersData.length === 0) {
        console.warn('No workers found in the system');
      } else {
        console.log(`Fetched ${workersData.length} workers:`, workersData.map(w => ({
          _id: w._id,
          name: w.name,
          email: w.email
        })));
      }
      
      setWorkers(workersData);
      return workersData;
    } catch (error) {
      console.error("Error fetching workers:", error);
      setMessage('Error loading workers. Please refresh the page to try again.');
      return [];
    }
  };

  const handleAssignmentChange = async (taskId, newWorkerIds) => {
    const currentTask = tasks.find(t => t._id === taskId);
    const currentWorkerIds = (currentTask?.assignedWorkers || [])
      .map(w => typeof w === "object" && w._id ? w._id : w)
      .filter(Boolean);

    // Determine what changed
    const addedWorkers = newWorkerIds.filter(id => !currentWorkerIds.includes(id));
    const removedWorkers = currentWorkerIds.filter(id => !newWorkerIds.includes(id));

    // If nothing changed, return
    if (addedWorkers.length === 0 && removedWorkers.length === 0) {
      return;
    }

    // Get worker names for confirmation
    const getWorkerNames = (ids) => ids.map(id => 
      workers.find(w => w._id === id)?.name || 'Unknown'
    ).join(', ');

    let confirmMessage = '';
    if (addedWorkers.length > 0 && removedWorkers.length === 0) {
      confirmMessage = `Would you like to assign ${getWorkerNames(addedWorkers)} to this task?`;
    } else if (removedWorkers.length > 0 && addedWorkers.length === 0) {
      confirmMessage = `Would you like to unassign ${getWorkerNames(removedWorkers)} from this task?`;
    } else {
      confirmMessage = `Update worker assignments?`;
    }

    if (!window.confirm(confirmMessage)) {
      // Revert the UI by refreshing tasks
      await fetchTodayTasks();
      return;
    }

    try {
      setLoading(true);
      console.log('Sending:', { taskId, assignedWorkers: newWorkerIds });
      
      const response = await api.put(`/tasks/${taskId}`, {
        assignedWorkers: newWorkerIds
      });

      if (response.data.success) {
        await fetchTodayTasks();
        setMessage(newWorkerIds.length === 0 ? 'Workers unassigned successfully' : 'Workers assigned successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Full error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.response?.data?.message);
      console.error('Validation errors:', error.response?.data?.errors);
      
      const errorMsg = error.response?.data?.errors?.[0]?.message || 
                       error.response?.data?.message || 
                       'Error updating workers';
      setMessage(errorMsg);
      await fetchTodayTasks();
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#dc3545";
      case "medium":
        return "#ffc107";
      case "low":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#6c757d";
      case "on-schedule":
        return "#28a745";
      case "behind":
        return "#dc3545";
      case "ahead":
        return "#17a2b8";
      case "completed":
        return "#28a745";
      default:
        return "#6c757d";
    }
  };

  const openWorkerSubmit = (task) => {
    setSelectedTask(task);
    setShowWorkerSubmit(true);
  };

  const closeWorkerSubmit = () => {
    setShowWorkerSubmit(false);
    setSelectedTask(null);
  };

  // Update task status in the tasks list
  const updateTaskStatus = (taskId, status) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === taskId 
          ? { ...task, status: status.toLowerCase() } 
          : task
      )
    );
  };

  return (
    <div style={{ padding: "20px", position: 'relative' }}>
      {showWorkerSubmit && selectedTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Submit Work for: {selectedTask.taskName}</h3>
              <button 
                onClick={closeWorkerSubmit}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <WorkerSubmit 
              task={selectedTask._id} 
              onClose={closeWorkerSubmit} 
              onWorkSubmitted={updateTaskStatus}
            />
          </div>
        </div>
      )}
      <h2>Today's Task Assignment</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Assign today's tasks to available workers. These tasks have been added
        by the admin for today's schedule.
      </p>

      {message && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: message.includes("Error") ? "#f8d7da" : "#d4edda",
            color: message.includes("Error") ? "#721c24" : "#155724",
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div>Loading today's tasks...</div>
      ) : tasks.length === 0 ? (
        <div>No tasks assigned for today.</div>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {tasks.map((task) => (
            <div
              key={task._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "15px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 5px 0" }}>{task.taskName}</h4>
                  <p style={{ margin: "0 0 10px 0", color: "#666" }}>
                    {task.description}
                  </p>
                  <div style={{ fontSize: "13px", color: "#555", display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>📅</span>
                      <span>Schedule: {new Date(task.date).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span></div>
                    {(() => {
                      const dateField = task.deadline ? 'deadline' : 
                                      task.dueDate ? 'dueDate' : 
                                      task.endDate ? 'endDate' : 
                                      task.targetDate ? 'targetDate' : null;
                      const dateValue = task[dateField];
                      
                      if (!dateValue) return null;
                      
                      const dateLabels = {
                        'deadline': 'Deadline',
                        'dueDate': 'Due Date',
                        'endDate': 'End Date',
                        'targetDate': 'Target Date'
                      };
                      
                      return (
                        <div style={{ 
                          color: '#d32f2f',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span>⏰</span>
                          <span>{dateLabels[dateField]}: {new Date(dateValue).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      backgroundColor: getPriorityColor(task.priority),
                      color: "white",
                      height: "24px"
                    }}
                  >
                    {task.priority.toUpperCase()}
                  </span>
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

              {/* Worker Assignment */}
              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: "bold" }}>Assign Workers:</label>

                  <select
                    multiple
                    value={(task.assignedWorkers || []).map(w => typeof w === "object" && w._id ? w._id : null).filter(Boolean)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                      handleAssignmentChange(task._id, selected);
                    }}

                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      minHeight: "60px",
                    }}
                  >
                    {workers.map((worker) => (
                      <option key={worker._id || worker.id} value={worker._id || worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: "200px" }}>
                  <label style={{ fontWeight: "bold" }}>
                    Currently Assigned:
                  </label>

                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "8px",
                      borderRadius: "4px",
                      minHeight: "60px",
                    }}
                  >
                    {task.assignedWorkers?.length ? (
                      <ul>
                        {task.assignedWorkers.map((worker, index) => {
                          const workerName =
                            typeof worker === "object" && worker.name
                              ? worker.name
                              : workers.find((w) => w._id === worker)?.name || "Unknown";

                          return <li key={index}>{workerName}</li>;
                        })}
                      </ul>
                    ) : (
                      <i>No workers assigned</i>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Work Button */}
              <button
                onClick={() => openWorkerSubmit(task)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  width: "200px",
                  display: "block",
                  margin: "15px auto 0 auto",
                  fontWeight: "bold",
                }}
              >
                Submit Work
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SupervisorTaskAssignment;
