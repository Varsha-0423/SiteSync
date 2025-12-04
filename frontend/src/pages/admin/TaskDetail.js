import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

import {
  Card,
  Tabs,
  Tag,
  Button,
  Descriptions,
  Spin,
  Image,
  Row,
  Col,
  message,
  Modal
} from "antd";

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const handlePreview = async (url, title = '') => {
    setPreviewImage(url.startsWith('http') ? url : `http://localhost:5000${url}`);
    setPreviewTitle(title);
    setPreviewVisible(true);
  };

  const handleCancel = () => setPreviewVisible(false);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workReports, setWorkReports] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load Task + Reports
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const taskRes = await api.get(`/tasks/${taskId}`);
        if (!taskRes.data.success) {
          setError("Task not found");
          setLoading(false);
          return;
        }

        setTask(taskRes.data.data);

        // Get Work Reports
        const reportsRes = await api.get(`/work/task/${taskId}`);
        if (reportsRes.data.success) {
          const processed = reportsRes.data.data.map((r) => ({
            ...r,
            photoUrls: r.attachments || [],
            workerName: r.worker?.name || "Unknown",
          }));
          setWorkReports(processed);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [taskId]);

  // Load workers
  useEffect(() => {
    api
      .get("/users?role=worker")
      .then((res) => setWorkers(res.data.data || []))
      .catch(() => {});
  }, []);

  // LOADING UI
  if (loading)
    return (
      <div>
        <div style={{ padding: 80, textAlign: "center" }}>
          <Spin size="large" />
        </div>
      </div>
    );

  // ERROR UI
  if (error)
    return (
      <div>
        <Card style={{ margin: 40, padding: 40, textAlign: "center" }}>
          <h3>{error}</h3>
          <Button style={{ marginTop: 20 }} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );

  // STATUS COLOR LOGIC
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "green";
      case "in-progress":
        return "blue";
      case "pending":
        return "orange";
      case "rejected":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <>
      <div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <Button onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
          ← Back
        </Button>
      </div>

      <Card
        title={task.taskName || "Task Details"}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
        extra={
          <Tag color={getStatusColor(task.status)}>
            {task.status?.toUpperCase()}
          </Tag>
        }
      >
        <Tabs
          type="card"
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "Task Details",
              children: (
                <Descriptions
                  bordered
                  column={2}
                  size="middle"
                  labelStyle={{ fontWeight: 600 }}
                >
                  <Descriptions.Item label="Activity ID">
                    {task.activityId || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Activity Name">
                    {task.activityName || task.taskName || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Start Date">
                    {formatDate(task.startDate)}
                  </Descriptions.Item>

                  <Descriptions.Item label="End Date">
                    {formatDate(task.endDate)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Remarks">
                    {task.remarks || "None"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Supervisor">
                    {task.supervisor?.name || "Not assigned"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Marked For Today">
                    <Tag color={task.isForToday ? "green" : "red"}>
                      {task.isForToday ? "YES" : "NO"}
                    </Tag>
                  </Descriptions.Item>

                  {task.assignedWorkers?.length > 0 && (
                    <Descriptions.Item label="Assigned Workers" span={2}>
                      {task.assignedWorkers.map((worker, index) => {
                        // Handle both object and string worker formats
                        let workerName = 'Unknown';
                        let workerId = `worker-${index}`;
                        
                        if (typeof worker === 'object' && worker !== null) {
                          workerName = worker.name || worker.username || 'Unnamed Worker';
                          workerId = worker._id || worker.id || workerId;
                        } else if (typeof worker === 'string') {
                          // If worker is just an ID, try to find the worker in the workers list
                          const foundWorker = workers.find(w => w._id === worker || w.id === worker);
                          if (foundWorker) {
                            workerName = foundWorker.name || foundWorker.username || 'Unnamed Worker';
                            workerId = foundWorker._id || foundWorker.id || workerId;
                          } else {
                            workerName = `Worker ${worker.substring(0, 6)}...`;
                            workerId = worker;
                          }
                        }
                        
                        return (
                          <Tag 
                            key={workerId} 
                            color="blue" 
                            style={{ 
                              marginBottom: 6,
                              marginRight: 8,
                              padding: '4px 10px',
                              borderRadius: 4
                            }}
                          >
                            {workerName}
                          </Tag>
                        );
                      })}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              ),
            },

            {
              key: "2",
              label: `Work Updates (${workReports.length})`,
              children: (
                <div>
                  {workReports.length === 0 ? (
                    <p>No work updates submitted.</p>
                  ) : (
                    workReports.map((report) => (
                      <Card
                        key={report._id}
                        style={{
                          marginBottom: 20,
                          borderRadius: 10,
                          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                        }}
                        title={
                          <Row justify="space-between">
                            <Col>{report.workerName}</Col>
                            <Col>
                              <Tag color={getStatusColor(report.status)}>
                                {report.status}
                              </Tag>
                            </Col>
                          </Row>
                        }
                      >
                        <p>
                          <strong>Updated On:</strong> {formatDate(report.updatedAt)}
                        </p>

                        {report.updateText && (
                          <p>
                            <strong>Work Update:</strong> {report.updateText}
                          </p>
                        )}

                        {report.quantity && (
                          <p>
                            <strong>Quantity:</strong>{" "}
                            {report.quantity} {report.unit}
                          </p>
                        )}

                        {(report.photoUrls?.length > 0 || report.photoUrl) && (
                          <div style={{ marginTop: 16 }}>
                            <strong>Photos:</strong>
                            <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                              {report.photoUrls?.length > 0 
                                ? report.photoUrls.map((url, i) => (
                                    <Col key={i} span={6}>
                                      <div style={{ 
                                        position: 'relative', 
                                        paddingBottom: '100%',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        backgroundColor: '#f9f9f9'
                                      }}>
                                        <img
                                          src={url.startsWith('http') ? url : `http://localhost:5000${url}`}
                                          style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            backgroundColor: 'white',
                                            cursor: 'pointer'
                                          }}
                                          alt={`Work image ${i + 1}`}
                                          onClick={() => handlePreview(url, `Work Image ${i + 1}`)}
                                        />
                                      </div>
                                    </Col>
                                  ))
                                : report.photoUrl && (
                                    <Col span={6}>
                                      <div style={{ 
                                        position: 'relative', 
                                        paddingBottom: '100%',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        backgroundColor: '#f9f9f9'
                                      }}>
                                        <img
                                          src={report.photoUrl.startsWith('http') ? report.photoUrl : `http://localhost:5000${report.photoUrl}`}
                                          style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            backgroundColor: 'white',
                                            cursor: 'pointer'
                                          }}
                                          alt="Work image"
                                          onClick={() => handlePreview(report.photoUrl, 'Work Image')}
                                        />
                                      </div>
                                    </Col>
                                  )}
                            </Row>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
      </div>

      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{
          padding: 0,
          margin: 0,
          height: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f2f5'
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            boxSizing: 'border-box'
          }}
        >
          <img
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              cursor: 'pointer',
              display: 'block'
            }}
            src={previewImage}
            onClick={handleCancel}
          />
        </div>
      </Modal>
    </>
  );
};

export default TaskDetail;
