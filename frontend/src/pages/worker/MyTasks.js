import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Badge, Button, Spin, message, Empty, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkerTasks, updateTaskStatus } from '../../services/workerService';

const { Text } = Typography;

const MyTasks = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await getWorkerTasks(currentUser.id, filter);
      setTasks(tasksData);
    } catch (error) {
      message.error('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      setLoading(true);
      await updateTaskStatus(taskId, { status: newStatus });
      message.success('Task status updated successfully');
      fetchTasks();
    } catch (error) {
      message.error('Failed to update task status');
      console.error('Error updating task status:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge status="success" text="Completed" />;
      case 'inProgress':
        return <Badge status="processing" text="In Progress" />;
      case 'overdue':
        return <Badge status="error" text="Overdue" />;
      default:
        return <Badge status="default" text="Assigned" />;
    }
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      high: { color: 'red', text: 'High' },
      medium: { color: 'orange', text: 'Medium' },
      low: { color: 'green', text: 'Low' }
    };
    const { color, text } = priorityMap[priority] || { color: 'default', text: 'N/A' };
    return <Tag color={color}>{text}</Tag>;
  };

  const getStatusActions = (task) => {
    switch (task.status) {
      case 'assigned':
        return (
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleStatusUpdate(task.id, 'inProgress')}
          >
            Start Task
          </Button>
        );
      case 'inProgress':
        return (
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleStatusUpdate(task.id, 'completed')}
          >
            Mark Complete
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card 
        title="My Tasks"
        extra={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button 
              type={filter === 'all' ? 'primary' : 'default'} 
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              type={filter === 'inProgress' ? 'primary' : 'default'} 
              onClick={() => setFilter('inProgress')}
            >
              In Progress
            </Button>
            <Button 
              type={filter === 'completed' ? 'primary' : 'default'} 
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : tasks.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={tasks}
            renderItem={task => (
              <List.Item
                actions={[getStatusActions(task)].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>{task.title}</span>
                      {getPriorityTag(task.priority)}
                    </div>
                  }
                  description={
                    <div>
                      <div>{task.description}</div>
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary" style={{ marginRight: '16px' }}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Text>
                        {getStatusBadge(task.status)}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>No tasks found</span>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default MyTasks;