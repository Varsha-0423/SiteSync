import React, { useState, useEffect } from "react";
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
} from "antd";
import { 
  PlusOutlined, 
  UserAddOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { getDashboardStats, getTasks, deleteTask } from "../../services/dashboardService";
import TaskAssignment from "../../components/TaskAssignment";
import WorkerAssignment from "../../components/WorkerAssignment";

const { Title, Text } = Typography;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    assignedWorker: 'all'
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // This should come from auth context

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const statsData = await getDashboardStats();
      setStats(statsData);
      
      // Fetch tasks with filters
      const taskFilters = {};
      if (filters.status !== 'all') taskFilters.status = filters.status;
      if (filters.assignedWorker !== 'all') taskFilters.assignedWorker = filters.assignedWorker;
      
      const tasksData = await getTasks(taskFilters);
      setTasks(tasksData);
    } catch (error) {
      message.error('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
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
    const menuItems = [];
    
    // Add worker assignment action for supervisors and admins
    if (userRole === 'supervisor' || userRole === 'admin') {
      menuItems.push(
        <Menu.Item key="assign" icon={<UserAddOutlined />}>
          <Button type="link" onClick={() => setShowWorkerModal(true)}>
            Assign Workers
          </Button>
        </Menu.Item>
      );
    }
    
    // Add edit/delete actions for admins only
    if (userRole === 'admin') {
      menuItems.push(
        <Menu.Item key="edit" icon={<EditOutlined />}>
          <Button type="link">Edit Task</Button>
        </Menu.Item>,
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

      {/* FILTERS */}
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Text strong>Filter by Status</Text>
          <Select 
            value={filters.status} 
            onChange={handleStatusFilterChange}
            style={{ width: "100%", marginTop: 5 }}
          >
            <Select.Option value="all">All Statuses</Select.Option>
            <Select.Option value="on-schedule">On Schedule</Select.Option>
            <Select.Option value="behind">Behind</Select.Option>
            <Select.Option value="ahead">Ahead</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
          </Select>
        </Col>

        <Col xs={24} sm={12}>
          <Text strong>Filter by Employee</Text>
          <Select 
            value={filters.assignedWorker} 
            onChange={handleWorkerFilterChange}
            style={{ width: "100%", marginTop: 5 }}
          >
            <Select.Option value="all">All Employees</Select.Option>
            {stats?.userStats?.map((userStat, index) => (
              <Select.Option key={index} value={userStat.user}>
                {userStat.user}
              </Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Divider />

      {/* EMPLOYEE PERFORMANCE METRICS */}
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

      {/* TASK PROGRESS ANALYSIS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card style={{ borderLeft: "4px solid #52c41a" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              {stats?.onScheduleTasks || 0}
            </Title>
            <Text>On Schedule</Text>
            <p style={{ marginTop: 5 }}>Tasks progressing as planned</p>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card style={{ borderLeft: "4px solid #ff4d4f" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              {stats?.behindTasks || 0}
            </Title>
            <Text>Behind Schedule</Text>
            <p style={{ marginTop: 5 }}>Tasks requiring attention</p>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card style={{ borderLeft: "4px solid #faad14" }}>
            <Title level={3} style={{ marginBottom: 0 }}>
              {stats?.aheadTasks || 0}
            </Title>
            <Text>Ahead of Schedule</Text>
            <p style={{ marginTop: 5 }}>Tasks exceeding expectations</p>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* ALL TASKS */}
      <Row align="middle" justify="space-between">
        <Title level={4}>All Tasks ({tasks.length})</Title>
        <div>
          {userRole === 'admin' && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setShowTaskModal(true)}
              style={{ marginRight: 8 }}
            >
              Create Task
            </Button>
          )}
          {(userRole === 'supervisor' || userRole === 'admin') && (
            <Button 
              icon={<UserAddOutlined />}
              onClick={() => setShowWorkerModal(true)}
              style={{ marginRight: 8 }}
            >
              Assign Workers
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
      ) : (
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
                      marginBottom: 10,
                      backgroundColor: getStatusColor(task.status),
                      borderColor: getStatusColor(task.status)
                    }}
                  >
                    {task.status?.replace('-', ' ').toUpperCase() || 'PENDING'}
                  </Button>
                  {getTaskActions(task)}
                </div>
                <Progress percent={task.progress || 0} showInfo />
                <Button style={{ marginTop: 10 }}>View Details</Button>
              </Col>
            </Row>
          </Card>
        ))
      )}

      {tasks.length === 0 && !loading && (
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
