import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [workReports, setWorkReports] = useState([]);

  useEffect(() => {
    const fetchTaskAndReports = async () => {
      if (!taskId) {
        setError('No task ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // Fetch task details
        const taskRes = await api.get(`/tasks/${taskId}`);
        
        if (taskRes.data && taskRes.data.success) {
          setTask(taskRes.data.data);
          
          // Fetch work reports
          try {
            const reportsRes = await api.get(`/work/task/${taskId}`);
            if (reportsRes.data && reportsRes.data.success) {
              const reports = Array.isArray(reportsRes.data.data) ? reportsRes.data.data : [];
              // Process reports to ensure they have the expected structure
              const processedReports = reports.map(report => ({
                ...report,
                photoUrls: report.attachments || [],
                workerName: report.worker?.name || 'Unknown Worker',
                workerEmail: report.worker?.email || '',
                status: report.status || 'pending',
                date: report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Unknown date'
              }));
              setWorkReports(processedReports);
            }
          } catch (reportErr) {
            console.warn('Could not load work reports:', reportErr);
            setWorkReports([]);
            // Don't show error to user for missing reports
          }
        } else {
          setError('Task not found');
        }
      } catch (err) {
        console.error('Error fetching task details:', err);
        if (err.response) {
          if (err.response.status === 401) {
            setError('Please log in to view this task');
            // Optionally redirect to login
            // navigate('/login');
          } else if (err.response.status === 403) {
            setError('You do not have permission to view this task');
          } else if (err.response.status === 404) {
            setError('Task not found');
          } else {
            setError(`Error: ${err.response.data?.message || 'Failed to load task details'}`);
          }
        } else {
          setError('Failed to connect to the server. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndReports();
  }, [taskId, navigate]);

  if (loading) return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '200px',
      fontSize: '18px',
      color: '#666'
    }}>
      Loading task details...
    </div>
  );
  
  if (error) return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#fff8f8', 
      border: '1px solid #ffdddd',
      borderRadius: '4px',
      margin: '20px',
      color: '#721c24',
      textAlign: 'center'
    }}>
      {error}
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Try Again
        </button>
        <button 
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
  
  if (!task) return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      border: '1px solid #ddd',
      borderRadius: '4px',
      margin: '20px',
      textAlign: 'center'
    }}>
      Task not found or you don't have permission to view it
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };


  return (
    <div className="task-detail-container">
      <h2>Task Details</h2>
      <div className="task-header">
        <h3>{task.title}</h3>
        <p>Status: <span className={`status-${task.status}`}>{task.status}</span></p>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'details' ? 'active' : ''}
          onClick={() => setActiveTab('details')}
        >
          Task Details
        </button>
        <button 
          className={activeTab === 'updates' ? 'active' : ''}
          onClick={() => setActiveTab('updates')}
        >
          Work Updates ({workReports.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'details' ? (
          <div className="task-details">
            {/* Task Status and Basic Info */}
            <div className="detail-section">
              <h3>Task Information</h3>
              <div className="detail-row">
                <span className="label">Task Status:</span>
                <span className={`status-${task.status || 'pending'}`}>
                  {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Pending'}
                </span>
              </div>
              
              {/* Original Task Details */}
              <div className="detail-row">
                <span className="label">Task Title:</span>
                <span>{task.title || 'Untitled Task'}</span>
              </div>
              {task.description && (
                <div className="detail-row">
                  <span className="label">Description:</span>
                  <span>{task.description}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">Created On:</span>
                <span>{formatDate(task.createdAt) || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Deadline:</span>
                <span>{formatDate(task.deadline) || 'Not set'}</span>
              </div>
            </div>
            {/* Supervisor Submission Section */}
            {workReports.length > 0 ? (
              <div className="submission-section">
                <h3>Supervisor Submission</h3>
                <div className="submission-details">
                  <div className="detail-row">
                    <span className="label">Submitted By:</span>
                    <span className="value">
                      {workReports[0].worker?.name || task.supervisor?.name || 'Unknown Supervisor'}
                      {workReports[0].worker?.email ? ` (${workReports[0].worker.email})` : ''}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Submission Status:</span>
                    <span className={`status-${workReports[0].status || 'pending'}`}>
                      {workReports[0].status ? workReports[0].status.charAt(0).toUpperCase() + workReports[0].status.slice(1) : 'Pending Review'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Submitted On:</span>
                    <span className="value">{formatDate(workReports[0].updatedAt) || 'N/A'}</span>
                  </div>
                  
                  {/* Work Details */}
                  {workReports[0].updateText && (
                    <div className="work-update">
                      <div className="label">Work Update:</div>
                      <div className="update-content">{workReports[0].updateText}</div>
                    </div>
                  )}
                  
                  {/* Quantity and Unit */}
                  {(workReports[0].quantity || workReports[0].unit) && (
                    <div className="work-metrics">
                      <div className="detail-row">
                        <span className="label">Quantity:</span>
                        <span className="value">
                          {workReports[0].quantity || '0'} {workReports[0].unit || ''}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Submitted Photos */}
                  {workReports[0].photoUrls?.length > 0 && (
                    <div className="submission-photos">
                      <div className="label">Submitted Photos:</div>
                      <div className="photo-grid">
                        {workReports[0].photoUrls.map((url, index) => (
                          <div key={index} className="photo-thumbnail" onClick={() => window.open(url, '_blank')}>
                            <img 
                              src={url} 
                              alt={`Submission ${index + 1}`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="detail-row">
                  <span className="label">Description:</span>
                  <span>{task.description || 'No description provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Start Date:</span>
                  <span>{formatDate(task.startDate) || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Deadline:</span>
                  <span>{formatDate(task.deadline) || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Supervisor:</span>
                  <span>{task.supervisor?.name || 'Not assigned'}</span>
                </div>
              </>
            )}
            {task.assignedWorkers?.length > 0 && (
              <div className="assigned-workers">
                <h4>Assigned Workers:</h4>
                <ul>
                  {task.assignedWorkers.map(worker => (
                    <li key={worker._id}>{worker.name || `Worker ${worker._id}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="work-updates">
            {workReports.length === 0 ? (
              <p>No work updates available.</p>
            ) : (
              <div className="updates-list">
                {workReports.map((report, index) => (
                  <div key={report._id} className="update-card">
                    <div className="update-header">
                      <span className="update-worker">
                        {report.worker?.name || 'Unknown Worker'}
                      </span>
                      <span className="update-date">
                        {formatDate(report.updatedAt)}
                      </span>
                    </div>
                    <div className="update-status">
                      Status: <span className={`status-${report.status}`}>{report.status}</span>
                    </div>
                    {report.quantity && (
                      <div className="update-quantity">
                        Quantity: {report.quantity} {report.unit || ''}
                      </div>
                    )}
                    {report.updateText && (
                      <div className="update-text">
                        <p>{report.updateText}</p>
                      </div>
                    )}
                    {report.photoUrls && report.photoUrls.length > 0 && (
                      <div className="update-photos" style={{ 
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                          gap: '10px',
                          marginTop: '10px'
                        }}>
                          {report.photoUrls.map((url, i) => {
                            // Ensure the URL is properly formatted
                            const imageUrl = url.startsWith('http') ? url : `${process.env.REACT_APP_API_URL || ''}${url}`;
                            return (
                              <div key={i} style={{ 
                                position: 'relative',
                                paddingBottom: '100%',
                                overflow: 'hidden',
                                borderRadius: '4px',
                                border: '1px solid #eee',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backgroundColor: '#f8f9fa',
                                ':hover': {
                                  transform: 'scale(1.03)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }
                              }}>
                                <img 
                                  src={imageUrl} 
                                  alt={`Work update ${i + 1}`}
                                  style={{ 
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover' 
                                  }}
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .task-detail-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        .task-header {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .tabs button {
          padding: 10px 20px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          color: #666;
          border-bottom: 2px solid transparent;
        }
        .tabs button.active {
          color: #1890ff;
          border-bottom-color: #1890ff;
          font-weight: 500;
        }
        .tabs button:hover {
          color: #40a9ff;
        }
        .detail-row {
          margin-bottom: 15px;
          display: flex;
          gap: 15px;
        }
        .label {
          font-weight: 500;
          min-width: 120px;
          color: #333;
        }
        .update-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .update-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          color: #666;
        }
        .update-status {
          margin: 8px 0;
          font-weight: 500;
        }
        .update-text {
          margin: 12px 0;
          line-height: 1.5;
        }
        .update-photos {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }
        .photo-thumbnail {
          width: 100px;
          height: 100px;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #eee;
          cursor: pointer;
        }
        .photo-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .status-completed {
          color: #52c41a;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: #f6ffed;
          border: 1px solid #b7eb8f;
        }
        .status-in-progress {
          color: #1890ff;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: #e6f7ff;
          border: 1px solid #91d5ff;
        }
        .status-pending {
          color: #faad14;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: #fffbe6;
          border: 1px solid #ffe58f;
        }
        .status-rejected {
          color: #ff4d4f;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: #fff2f0;
          border: 1px solid #ffccc7;
        }
        .assigned-workers {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .assigned-workers ul {
          list-style: none;
          padding: 0;
          margin: 10px 0 0 0;
        }
        .assigned-workers li {
          padding: 5px 0;
          border-bottom: 1px solid #f5f5f5;
        }
      `}</style>
    </div>
  );
}

export default TaskDetail;
