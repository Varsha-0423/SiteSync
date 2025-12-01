import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Divider,
  Spin,
  Button,
  message,
  Dropdown,
  Menu
} from "antd";
import { 
  PlusOutlined, 
  MoreOutlined, 
  DeleteOutlined, 
  EyeOutlined
} from '@ant-design/icons';
import { getDashboardStats, getTasks, deleteTask } from "../../services/dashboardService";
import TaskAssignment from "../../components/TaskAssignment";
import WorkerAssignment from "../../components/WorkerAssignment";

// Chart.js imports
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const { Title, Text } = Typography;

function Dashboard() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    onScheduleTasks: 0,
    behindTasks: 0,
    aheadTasks: 0,
    completedTasks: 0,
    issuesTasks: 0,
    pendingTasks: 0,
    userStats: []
  });
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', assignedWorker: 'all' });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // replace with auth context

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardStats();
      if (!response) throw new Error('No response from server');

      const data = response.data || response;

      setStats({
        totalTasks: data.totalTasks || 0,
        onScheduleTasks: data.onScheduleTasks || 0,
        behindTasks: data.behindTasks || 0,
        aheadTasks: data.aheadTasks || 0,
        completedTasks: data.completedTasks || 0,
        issuesTasks: data.issuesTasks || 0,
        pendingTasks: data.pendingTasks || 0,
        userStats: data.userStats || []
      });

      const taskFilters = {};
      if (filters.status !== 'all') taskFilters.status = filters.status;
      if (filters.assignedWorker !== 'all') taskFilters.assignedWorker = filters.assignedWorker;
      const tasksData = await getTasks(taskFilters);
      setTasks(tasksData);
    } catch (error) {
      setError({ message: error.message });
      message.error(`Error: ${error.message}`);
      setStats({
        totalTasks: 0,
        onScheduleTasks: 0,
        behindTasks: 0,
        aheadTasks: 0,
        completedTasks: 0,
        issuesTasks: 0,
        pendingTasks: 0,
        userStats: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (value) => setFilters(prev => ({ ...prev, status: value }));
  const handleWorkerFilterChange = (value) => setFilters(prev => ({ ...prev, assignedWorker: value }));
  const handleTaskCreated = () => fetchDashboardData();
  const handleWorkersAssigned = () => fetchDashboardData();

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      message.success('Task deleted successfully');
      fetchDashboardData();
    } catch (error) {
      message.error('Failed to delete task');
    }
  };

  const getTaskActions = (task) => {
    const menuItems = [
      <Menu.Item key="view" icon={<EyeOutlined />}>
        <Button type="link" onClick={() => navigate(`/admin/tasks/${task._id}`)}>View Details</Button>
      </Menu.Item>
    ];
    if (userRole === 'admin') {
      menuItems.push(
        <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
          <Button type="link" danger onClick={() => handleDeleteTask(task._id)}>Delete Task</Button>
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
    return <div style={{ padding: "20px", textAlign: "center" }}><Spin size="large" /></div>;
  }

  // ---------------- Budget Analysis ----------------
  // Use backend-calculated budget stats if available, otherwise calculate on frontend
  const budgetStats = stats?.budgetStats || {
    totalBudget: 0,
    avgBudgetPerTask: 0,
    mostExpensiveTask: { name: '', budget: 0 },
    mostExpensiveCategory: { name: '', amount: 0 },
    categoryTotals: {
      prelimsStaffs: 0,
      overheadStaffs: 0,
      material: 0,
      equipment: 0,
      manpower: 0
    }
  };

  // Format category totals for the pie chart
  const categoryTotals = [
    { name: 'Prelims Staffs', value: budgetStats.categoryTotals.prelimsStaffs || 0 },
    { name: 'Overheads', value: budgetStats.categoryTotals.overheadStaffs || 0 },
    { name: 'Material', value: budgetStats.categoryTotals.material || 0 },
    { name: 'Equipment', value: budgetStats.categoryTotals.equipment || 0 },
    { name: 'Manpower', value: budgetStats.categoryTotals.manpower || 0 }
  ];

  // Process tasks for the budget per task chart
  const processedTasks = tasks.map(task => ({
    ...task,
    totalBudget: (task.prelimsStaffs || 0) + 
                (task.overheadStaffs || 0) + 
                (task.material || 0) + 
                (task.equipment || 0) + 
                (task.manpower || 0)
  }));

  // ---------------- JSX ----------------
  return (
    <div style={{ padding: "20px" }}>
      {/* PAGE TITLE */}
      <div style={{ background: "#5b89c7", padding: "30px", borderRadius: "8px", color: "white" }}>
        <Title style={{ color: "white", marginBottom: 0 }}>Task Dashboard</Title>
        <Text style={{ color: "white" }}>Monitor all tasks, track employee performance, and analyze progress in real-time</Text>
      </div>

      <br />

      {/* TASK PROGRESS ANALYSIS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #52c41a" }}>
            <Title level={3} style={{ marginBottom: 0 }}>{stats?.totalTasks || 0}</Title>
            <Text>Total</Text>
            <p style={{ marginTop: 5 }}>All tasks in system</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #1890ff" }}>
            <Title level={3} style={{ marginBottom: 0 }}>{stats?.completedTasks || 0}</Title>
            <Text>Completed</Text>
            <p style={{ marginTop: 5 }}>Tasks successfully finished</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #ff4d4f" }}>
            <Title level={3} style={{ marginBottom: 0 }}>{stats?.issuesTasks || 0}</Title>
            <Text>Issues</Text>
            <p style={{ marginTop: 5 }}>Tasks with problems</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #faad14" }}>
            <Title level={3} style={{ marginBottom: 0 }}>{stats?.pendingTasks || 0}</Title>
            <Text>Pending</Text>
            <p style={{ marginTop: 5 }}>Tasks not yet started</p>
          </Card>
        </Col>
      </Row>

      <Divider />
      {/* --------- BUDGET CHARTS --------- */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="Budget Distribution by Category">
            <Pie
              data={{
                labels: categoryTotals.map(c => c.name),
                datasets: [{
                  data: categoryTotals.map(c => c.value),
                  backgroundColor: ['#1890ff','#52c41a','#faad14','#ff4d4f','#722ed1'],
                  borderWidth: 1
                }]
              }}
              options={{ responsive: true }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Budget per Task">
            <Bar
              data={{
                labels: processedTasks.map(t => t.taskName),
                datasets: [{
                  label: 'Total Budget',
                  data: processedTasks.map(t => t.totalBudget),
                  backgroundColor: '#1890ff'
                }]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </Card>
        </Col>
      </Row>

{/* --------- BUDGET ANALYSIS --------- */}
      <Title level={4}>Budget Analysis</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #1890ff" }}>
            <Title level={3} style={{ marginBottom: 0 }}>₹{budgetStats.totalBudget.toLocaleString()}</Title>
            <Text>Total Budget</Text>
            <p style={{ marginTop: 5 }}>Sum of all tasks</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #52c41a" }}>
            <Title level={3} style={{ marginBottom: 0 }}>₹{Math.round(budgetStats.avgBudgetPerTask).toLocaleString()}</Title>
            <Text>Average Task</Text>
            <p style={{ marginTop: 5 }}>Average budget per task</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #faad14" }}>
            <Title level={3} style={{ marginBottom: 0 }}>{budgetStats.mostExpensiveTask.name || '-'}</Title>
            <Text>Highest Budget Task</Text>
            <p style={{ marginTop: 5 }}>₹{budgetStats.mostExpensiveTask.budget?.toLocaleString() || 0}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #ff4d4f" }}>
            <Title level={3} style={{ marginBottom: 0 }}>{budgetStats.mostExpensiveCategory.name || '-'}</Title>
            <Text>Most Expensive Category</Text>
            <p style={{ marginTop: 5 }}>₹{budgetStats.mostExpensiveCategory.amount?.toLocaleString() || 0}</p>
          </Card>
        </Col>
      </Row>
      
      <Divider />

      {/* ALL TASKS */}
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>All Tasks ({tasks.length})</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select value={filters.status} onChange={handleStatusFilterChange} style={{ width: 150 }}>
            <Select.Option value="all">All Statuses</Select.Option>
            <Select.Option value="on-schedule">On Schedule</Select.Option>
            <Select.Option value="behind">Behind</Select.Option>
            <Select.Option value="ahead">Ahead</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
          </Select>
          <Select value={filters.assignedWorker} onChange={handleWorkerFilterChange} style={{ width: 150 }}>
            <Select.Option value="all">All Employees</Select.Option>
            {stats?.userStats?.map((userStat, index) => (
              <Select.Option key={index} value={userStat.user}>{userStat.user}</Select.Option>
            ))}
          </Select>
          {userRole === 'admin' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowTaskModal(true)}>Create Task</Button>
          )}
          <Button type="default" onClick={fetchDashboardData} loading={loading}>Refresh</Button>
        </div>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
      ) : tasks.length > 0 ? (
        tasks.map((task) => (
          <Card key={task._id} style={{ marginTop: 10 }}>
            <Row justify="space-between" align="middle">
              <Col xs={24} sm={16}>
                <Title level={5}>{task.taskName}</Title>
                <Text>{task.description}</Text><br/>
                <Text strong>Assigned to:</Text>{" "}
                <Text>{task.assignedWorkers?.map(w => w.name).join(', ') || 'Unassigned'}</Text><br/>
                <Text strong>Due:</Text> <Text>{task.date ? new Date(task.date).toLocaleDateString() : 'No due date'}</Text><br/>
                <Text strong>Priority:</Text> <Text type={getPriorityColor(task.priority)}>{task.priority}</Text>
              </Col>
              <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                  <Button type="primary" style={{ backgroundColor: getStatusColor(task.status), borderColor: getStatusColor(task.status) }}>
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
      <TaskAssignment visible={showTaskModal} onClose={() => setShowTaskModal(false)} onSuccess={handleTaskCreated} />

      {/* Worker Assignment Modal */}
      <WorkerAssignment visible={showWorkerModal} onClose={() => setShowWorkerModal(false)} onSuccess={handleWorkersAssigned} />
    </div>
  );
}

export default Dashboard;
