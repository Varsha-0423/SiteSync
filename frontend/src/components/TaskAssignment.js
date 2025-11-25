import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  message,
  Row,
  Col,
} from "antd";
import api from "../api";

const { TextArea } = Input;
const { Option } = Select;

const TaskAssignment = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchWorkers();
      form.resetFields();
    }
  }, [visible, form]);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/users');
      const workersData = response.data.data.filter(user => user.role === 'worker');
      setWorkers(workersData);
    } catch (error) {
      message.error('Failed to fetch workers');
      console.error('Error fetching workers:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Format the data to match backend expectations
      const taskData = {
        taskName: values.taskName,
        description: values.description,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
        assignedWorkers: values.assignedWorkers || [],
        priority: values.priority || 'medium',
        status: 'pending'
      };

      // Call the API to create the task
      const response = await api.post('/api/tasks', taskData);
      
      if (response.data.success) {
        message.success('Task created successfully');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to create task');
      }
    } catch (error) {
      message.error('Failed to create task');
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New Task"
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
              name="taskName"
              label="Task Name"
              rules={[{ required: true, message: 'Please enter task name' }]}
            >
              <Input placeholder="Enter task name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea
                rows={3}
                placeholder="Enter task description"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="date"
              label="Due Date"
              rules={[{ required: true, message: 'Please select due date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="Select due date"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="priority"
              label="Priority"
              initialValue="medium"
            >
              <Select placeholder="Select priority">
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
              </Select>
            </Form.Item>
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
            >
              Create Task
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default TaskAssignment;
