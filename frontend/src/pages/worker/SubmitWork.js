import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Button, 
  Form, 
  Input, 
  Select, 
  Card, 
  message, 
  Spin, 
  List,
  Badge,
  Row,
  Col,
  Typography
} from 'antd';
import { 
  UploadOutlined, 
  PaperClipOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getIncompleteTasks, 
  submitWork, 
  getSubmissionHistory 
} from '../../services/workerService';

const { Text } = Typography;

const { TextArea } = Input;
const { Option } = Select;

const SubmitWork = () => {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, submissionsData] = await Promise.all([
        getIncompleteTasks(currentUser.id),
        getSubmissionHistory(currentUser.id)
      ]);
      setTasks(tasksData);
      setSubmissions(submissionsData);
    } catch (error) {
      message.error('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSelect = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task);
    form.setFieldsValue({ taskId, description: task?.description || '' });
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      
      // Add form fields to formData
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]);
      });
      
      // Add files to formData
      fileList.forEach(file => {
        formData.append('files', file.originFileObj);
      });

      await submitWork(formData);
      
      message.success('Work submitted successfully');
      form.resetFields();
      setFileList([]);
      setSelectedTask(null);
      fetchData();
    } catch (error) {
      message.error('Failed to submit work');
      console.error('Error submitting work:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge status="success" text="Approved" />;
      case 'rejected':
        return <Badge status="error" text="Rejected" />;
      case 'pending':
      default:
        return <Badge status="processing" text="Pending Review" />;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="Submit Work" 
            loading={loading}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="taskId"
                label="Select Task"
                rules={[{ required: true, message: 'Please select a task' }]}
              >
                <Select 
                  placeholder="Select a task"
                  onChange={handleTaskSelect}
                  showSearch
                  optionFilterProp="children"
                >
                  {tasks.map(task => (
                    <Option key={task.id} value={task.id}>
                      {task.title} - {task.status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="description"
                label="Work Description"
                rules={[{ required: true, message: 'Please enter a description' }]}
              >
                <TextArea rows={4} placeholder="Describe the work you've done" />
              </Form.Item>

              <Form.Item
                name="attachments"
                label="Attachments"
                extra="Upload any relevant files or screenshots"
              >
                <Upload
                  fileList={fileList}
                  onChange={handleFileChange}
                  beforeUpload={() => false}
                  multiple
                >
                  <Button icon={<UploadOutlined />}>Select Files</Button>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  disabled={!selectedTask}
                >
                  Submit Work
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="Submission History"
            loading={loading}
          >
            <List
              itemLayout="horizontal"
              dataSource={submissions}
              renderItem={submission => (
                <List.Item
                  actions={[
                    <span key="status">
                      {getStatusBadge(submission.status)}
                    </span>
                  ]}
                >
                  <List.Item.Meta
                    title={submission.taskTitle}
                    description={
                      <div>
                        <div>{submission.description}</div>
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary">
                            Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                          </Text>
                        </div>
                        {submission.feedback && (
                          <div style={{ marginTop: '8px' }}>
                            <Text strong>Feedback: </Text>
                            <Text>{submission.feedback}</Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SubmitWork;
