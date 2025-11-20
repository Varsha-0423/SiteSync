import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  message,
  Row,
  Col,
  Tag,
  Space,
} from "antd";
import { getUsersByRole, getTasks, updateTask } from "../services/dashboardService";

const { Option } = Select;

const WorkerAssignment = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchWorkers();
      fetchTasks();
      form.resetFields();
      setSelectedTask(null);
    }
  }, [visible, form]);

  const fetchWorkers = async () => {
    try {
      const workersData = await getUsersByRole('worker');
      setWorkers(workersData);
    } catch (error) {
      message.error('Failed to fetch workers');
      console.error('Error fetching workers:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const tasksData = await getTasks();
      setTasks(tasksData);
    } catch (error) {
      message.error('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    }
  };

  const handleTaskChange = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    setSelectedTask(task);
    
    if (task) {
      // Set current assigned workers in the form
      const currentWorkers = task.assignedWorkers?.map(w => w._id) || [];
      form.setFieldsValue({
        taskId: taskId,
        assignedWorkers: currentWorkers
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      await updateTask(values.taskId, {
        assignedWorkers: values.assignedWorkers || []
      });

      message.success('Workers assigned successfully');
      onSuccess();
      onClose();
    } catch (error) {
      message.error('Failed to assign workers');
      console.error('Error assigning workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w._id === workerId);
    return worker ? worker.name : 'Unknown';
  };

  return (
    <Modal
      title="Assign Workers to Task"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              name="taskId"
              label="Select Task"
              rules={[{ required: true, message: 'Please select a task' }]}
            >
              <Select
                placeholder="Select a task to assign workers"
                onChange={handleTaskChange}
              >
                {tasks.map(task => (
                  <Option key={task._id} value={task._id}>
                    {task.taskName} - {task.status}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {selectedTask && (
          <>
            <Row gutter={16}>
              <Col xs={24}>
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                  <strong>Task Details:</strong><br />
                  <span>{selectedTask.taskName}</span><br />
                  <span style={{ color: '#666' }}>{selectedTask.description}</span><br />
                  <span style={{ color: '#666' }}>Due: {selectedTask.date ? new Date(selectedTask.date).toLocaleDateString() : 'No due date'}</span>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="assignedWorkers"
                  label="Assign Workers"
                >
                  <Select
                    mode="multiple"
                    placeholder="Select workers to assign"
                    allowClear
                  >
                    {workers.map(worker => (
                      <Option key={worker._id} value={worker._id}>
                        {worker.name} ({worker.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {selectedTask.assignedWorkers && selectedTask.assignedWorkers.length > 0 && (
              <Row gutter={16}>
                <Col xs={24}>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Currently Assigned Workers:</strong><br />
                    <Space wrap>
                      {selectedTask.assignedWorkers.map(worker => (
                        <Tag key={worker._id} color="blue">
                          {worker.name}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Col>
              </Row>
            )}
          </>
        )}

        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col xs={24} style={{ textAlign: 'right' }}>
            <Button
              style={{ marginRight: 8 }}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!selectedTask}
            >
              Assign Workers
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default WorkerAssignment;
