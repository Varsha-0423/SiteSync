import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Divider,
  Progress,
  Button,
  Spin,
  message,
  Dropdown,
  Menu,
  Alert
} from "antd";
import { 
  PlusOutlined, 
  UserAddOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined,
  WarningOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { getDashboardStats, getTasks, deleteTask } from "../../services/dashboardService";
import TaskAssignment from "../../components/TaskAssignment";
import WorkerAssignment from "../../components/WorkerAssignment";

// Debug component to display the current state
const DebugPanel = ({ stats }) => (
  <div style={{ 
    position: 'fixed', 
    bottom: 0, 
    right: 0, 
    background: '#f0f2f5', 
    padding: '10px',
    border: '1px solid #d9d9d9',
    maxWidth: '400px',
    maxHeight: '300px',
    overflow: 'auto',
    zIndex: 1000
  }}>
    <h4>Debug Info:</h4>
    <pre>{JSON.stringify(stats, null, 2)}</pre>
  </div>
);

const { Title, Text } = Typography;

function Dashboard() {
  console.log('Dashboard component rendering...');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    onScheduleTasks: 0,
    behindTasks: 0,
    aheadTasks: 0,
    userStats: []
  });
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    assignedWorker: 'all'
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // This should come from auth context
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    console.log('fetchDashboardData called');
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      
      // Fetch dashboard statistics
      console.log('Calling getDashboardStats()...');
      const response = await getDashboardStats();
      console.log('API Response:', response);
      
      // Check if response is valid
      if (!response) {
        throw new Error('No response from server');
      }
      
      // Check for error in response
      if (response.error) {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
      
      // Check if data exists in the response
      if (!response.data) {
        console.warn('No data property in response, using response directly');
        // If no data property, use the response directly (for backward compatibility)
        setStats(prev => ({
          ...prev,
          ...response,
          // Ensure all required fields have default values
          totalTasks: response.totalTasks || 0,
          onScheduleTasks: response.onScheduleTasks || 0,
          behindTasks: response.behindTasks || 0,
          aheadTasks: response.aheadTasks || 0,
          userStats: response.userStats || []
        }));
      } else {
        // If data exists, use the nested data object
        console.log('Setting stats with data:', response.data);
        setStats(prev => ({
          ...prev,
          ...response.data,
          // Ensure all required fields have default values
          totalTasks: response.data.totalTasks || 0,
          onScheduleTasks: response.data.onScheduleTasks || 0,
          behindTasks: response.data.behindTasks || 0,
          aheadTasks: response.data.aheadTasks || 0,
          userStats: response.data.userStats || []
        }));
      }
      
      // Fetch tasks with filters
      const taskFilters = {};
      if (filters.status !== 'all') taskFilters.status = filters.status;
      if (filters.assignedWorker !== 'all') taskFilters.assignedWorker = filters.assignedWorker;
      
      const tasksData = await getTasks(taskFilters);
      console.log('Tasks data:', tasksData);
      setTasks(tasksData);
      console.log('Dashboard state updated with tasks:', tasksData);
    } catch (error) {
      const errorDetails = {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      };
      
      console.error('Error in fetchDashboardData:', errorDetails);
      
      // Set error state for UI feedback
      setError({
        message: 'Failed to load dashboard data',
        details: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Show error message to user
      message.error(`Error: ${error.message}`);
      
      // Reset to default values on error
      setStats({
        totalTasks: 0,
        onScheduleTasks: 0,
        behindTasks: 0,
        aheadTasks: 0,
        userStats: []
      });
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
      console.log('Current stats state:', stats);
    }
  };

  const handleStatusFilterChange = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleWorkerFilterChange = (value) => {
    setFilters(prev => ({ ...prev, assignedWorker: value }));
  };

  const handleTaskCreated = () => {
    fetchDashboardData();
  };

  const handleWorkersAssigned = () => {
    fetchDashboardData();
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      message.success('Task deleted successfully');
      fetchDashboardData();
    } catch (error) {
      message.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const getTaskActions = (task) => {
    const menuItems = [
      <Menu.Item key="view" icon={<EyeOutlined />}>
        <Button 
          type="link"
          onClick={() => navigate(`/admin/tasks/${task._id}`)}
        >
          View Details
        </Button>
      </Menu.Item>
    ];
    
    // Add edit/delete actions for admins only
    if (userRole === 'admin') {
      menuItems.push(
        <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
          <Button 
            type="link" 
            danger
            onClick={() => handleDeleteTask(task._id)}
          >
            Delete Task
          </Button>
        </Menu.Item>
      );
    }
    
    return (
      <Dropdown overlay={<Menu>{menuItems}</Menu>} trigger={['click']}>
        <Button icon={<MoreOutlined />} style={{ border: 'none' }} />
      </Dropdown>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-schedule': return '#52c41a';
      case 'behind': return '#ff4d4f';
      case 'ahead': return '#faad14';
      case 'completed': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* PAGE TITLE */}
      <div
        style={{
          background: "#5b89c7",
          padding: "30px",
          borderRadius: "8px",
          color: "white",
        }}
      >
        <Title style={{ color: "white", marginBottom: 0 }}>Task Dashboard</Title>
        <Text style={{ color: "white" }}>
          Monitor all tasks, track employee performance, and analyze progress in
          real-time
        </Text>
      </div>

      <br />

      {/* TASK PROGRESS ANALYSIS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #52c41a" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              {stats?.totalTasks || 0}
            </Title>
            <Text>Total</Text>
            <p style={{ marginTop: 5 }}>All tasks in system</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #1890ff" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              {stats?.completedTasks || 0}
            </Title>
            <Text>Completed</Text>
            <p style={{ marginTop: 5 }}>Tasks successfully finished</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #ff4d4f" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              {stats?.issuesTasks || 0}
            </Title>
            <Text>Issues</Text>
            <p style={{ marginTop: 5 }}>Tasks with problems</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #faad14" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              {stats?.pendingTasks || 0}
            </Title>
            <Text>Pending</Text>
            <p style={{ marginTop: 5 }}>Tasks not yet started</p>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* EMPLOYEES */}
      <Title level={4}>Employees</Title>
      <Row gutter={[16, 16]}>
        {stats?.userStats?.slice(0, 4).map((userStat, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card>
              <Title level={3} style={{ margin: 0 }}>
                {userStat.totalTasks}
              </Title>
              <Text>Total Tasks</Text> <br />
              <Text type="secondary">{userStat.user}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      {/* ALL TASKS */}
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>All Tasks ({tasks.length})</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select 
            value={filters.status} 
            onChange={handleStatusFilterChange}
            style={{ width: 150 }}
            placeholder="Filter by Status"
          >
            <Select.Option value="all">All Statuses</Select.Option>
            <Select.Option value="on-schedule">On Schedule</Select.Option>
            <Select.Option value="behind">Behind</Select.Option>
            <Select.Option value="ahead">Ahead</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
          </Select>
          <Select 
            value={filters.assignedWorker} 
            onChange={handleWorkerFilterChange}
            style={{ width: 150 }}
            placeholder="Filter by Employee"
          >
            <Select.Option value="all">All Employees</Select.Option>
            {stats?.userStats?.map((userStat, index) => (
              <Select.Option key={index} value={userStat.user}>
                {userStat.user}
              </Select.Option>
            ))}
          </Select>
          {userRole === 'admin' && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setShowTaskModal(true)}
            >
              Create Task
            </Button>
          )}
          <Button type="default" onClick={fetchDashboardData} loading={loading}>
            Refresh
          </Button>
        </div>
      </Row>

      {/* TASK CARDS */}
{loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : tasks.length > 0 ? (
        tasks.map((task) => (
          <Card key={task._id} style={{ marginTop: 10 }}>
            <Row justify="space-between" align="middle">
              <Col xs={24} sm={16}>
                <Title level={5}>{task.taskName}</Title>
                <Text>{task.description}</Text>
                <br />
                <Text strong>Assigned to:</Text>{" "}
                <Text>
                  {task.assignedWorkers?.map(worker => worker.name).join(', ') || 'Unassigned'}
                </Text>{" "}
                <br />
                <Text strong>Due:</Text>{" "}
                <Text>{task.date ? new Date(task.date).toLocaleDateString() : 'No due date'}</Text>{" "}
                <br />
                <Text strong>Priority:</Text>{" "}
                <Text type={getPriorityColor(task.priority)}>{task.priority}</Text>
              </Col>

              <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                  <Button 
                    type="primary" 
                    style={{ 
                      backgroundColor: getStatusColor(task.status),
                      borderColor: getStatusColor(task.status)
                    }}
                  >
                    {task.status?.replace('-', ' ').toUpperCase() || 'PENDING'}
                  </Button>
                  {getTaskActions(task)}
                </div>
              </Col>
            </Row>
          </Card>
        ))
      ) : (
        <Card style={{ marginTop: 10, textAlign: 'center' }}>
          <Text type="secondary">No tasks found matching the current filters.</Text>
        </Card>
      )}

      {/* Task Assignment Modal */}
      <TaskAssignment
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={handleTaskCreated}
      />

      {/* Worker Assignment Modal */}
      <WorkerAssignment
        visible={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        onSuccess={handleWorkersAssigned}
      />
    </div>
  );
}

export default Dashboard;
