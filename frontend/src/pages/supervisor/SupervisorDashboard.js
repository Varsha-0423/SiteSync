import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Divider, Spin, Modal } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { getDashboardStats, getTasks } from "../../services/dashboardService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;

function SupervisorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    issuesTasks: 0,
    pendingTasks: 0,
    userStats: []
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [activeChart, setActiveChart] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response?.data) {
        console.log('Dashboard stats:', response.data);
        setStats({
          ...response.data,
          userStats: response.data.userStats || []
        });
      }
      
      const tasks = await getTasks();
      if (tasks) {
        const sorted = tasks.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        ).slice(0, 5);
        setRecentTasks(sorted);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ background: "#5b89c7", padding: "30px", borderRadius: "8px", color: "white", marginBottom: "20px" }}>
        <Title style={{ color: "white", marginBottom: 0 }}>Supervisor Dashboard</Title>
        <Text style={{ color: "white" }}>Manage tasks & team status efficiently</Text>
      </div>

      {/* Stats Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card style={{ borderLeft: "4px solid #1890ff" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <ClockCircleOutlined style={{ fontSize: "40px", color: "#1890ff", marginRight: "16px" }} />
                <div>
                  <Text type="secondary">Pending Tasks</Text>
                  <Title level={2} style={{ margin: 0 }}>{stats.pendingTasks || 0}</Title>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card style={{ borderLeft: "4px solid #52c41a" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <CheckCircleOutlined style={{ fontSize: "40px", color: "#52c41a", marginRight: "16px" }} />
                <div>
                  <Text type="secondary">Completed</Text>
                  <Title level={2} style={{ margin: 0 }}>{stats.completedTasks || 0}</Title>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card style={{ borderLeft: "4px solid #ff4d4f" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <WarningOutlined style={{ fontSize: "40px", color: "#ff4d4f", marginRight: "16px" }} />
                <div>
                  <Text type="secondary">Issues Reported</Text>
                  <Title level={2} style={{ margin: 0 }}>{stats.issuesTasks || 0}</Title>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Divider />

      {/* Charts Section */}
      <Title level={4}>Task Analytics</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card 
            title="Task Status Distribution" 
            hoverable
            style={{ cursor: 'pointer', height: 230 }}
            onClick={() => {
              setActiveChart('status');
              setChartModalOpen(true);
            }}
          >
            <div style={{ height: 150 }}>
              <Pie
                data={{
                  labels: ['Pending', 'Completed', 'Issues'],
                  datasets: [{
                    data: [stats.pendingTasks || 0, stats.completedTasks || 0, stats.issuesTasks || 0],
                    backgroundColor: ['#1890ff', '#52c41a', '#ff4d4f'],
                  }]
                }}
                options={{ maintainAspectRatio: false, responsive: true }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Click to enlarge</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            title="Tasks per Worker"
            hoverable
            style={{ cursor: 'pointer', height: 230 }}
            onClick={() => {
              setActiveChart('worker');
              setChartModalOpen(true);
            }}
          >
            <div style={{ height: 150 }}>
              {(stats.userStats || []).length > 0 ? (
                <Bar
                  data={{
                    labels: stats.userStats.filter(u => (u.totalTasks || 0) > 0).map(u => u.user || u.name || 'Unknown'),
                    datasets: [{
                      label: 'Tasks',
                      data: stats.userStats.filter(u => (u.totalTasks || 0) > 0).map(u => u.totalTasks || u.taskCount || u.count || 0),
                      backgroundColor: '#1890ff',
                    }]
                  }}
                  options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } } }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Text type="secondary">No worker data available</Text>
                </div>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Click to enlarge</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            title="Completion Rate"
            hoverable
            style={{ cursor: 'pointer', height: 230 }}
            onClick={() => {
              setActiveChart('completion');
              setChartModalOpen(true);
            }}
          >
            <div style={{ height: 150 }}>
              <Pie
                data={{
                  labels: ['Completed', 'In Progress'],
                  datasets: [{
                    data: [
                      stats.completedTasks || 0,
                      (stats.totalTasks || 0) - (stats.completedTasks || 0)
                    ],
                    backgroundColor: ['#52c41a', '#faad14'],
                  }]
                }}
                options={{ maintainAspectRatio: false, responsive: true }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Click to enlarge</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Recent Activity */}
      <Title level={4}>Recent Activity</Title>
      <Card>
        {recentTasks.length > 0 ? (
          recentTasks.map((task, i) => {
            let timeAgo = 'Recently';
            if (task.updatedAt) {
              const diffMs = Date.now() - new Date(task.updatedAt);
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              if (hours > 0) {
                timeAgo = `${hours}h ${mins}m ago`;
              } else if (mins > 0) {
                timeAgo = `${mins}m ago`;
              } else {
                timeAgo = 'Just now';
              }
            }
            const workers = task.assignedWorkers?.map(w => w.name).join(', ') || 'Unassigned';
            return (
              <div key={task._id} style={{ padding: "12px 16px", borderBottom: i < recentTasks.length - 1 ? "1px solid #f0f0f0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <Text strong>{task.taskName}</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: "13px" }}>{workers} • {task.status || 'pending'}</Text>
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: "12px", whiteSpace: 'nowrap' }}>{timeAgo}</Text>
              </div>
            );
          })
        ) : (
          <div style={{ padding: "12px 16px" }}>
            <Text type="secondary">No recent activity</Text>
          </div>
        )}
      </Card>

      {/* Chart Modal */}
      <Modal
        open={chartModalOpen}
        onCancel={() => setChartModalOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 24, minHeight: "60vh" }}
      >
        {activeChart === 'status' && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Task Status Distribution</Title>
            <Pie
              data={{
                labels: ['Pending', 'Completed', 'Issues'],
                datasets: [{
                  data: [stats.pendingTasks || 0, stats.completedTasks || 0, stats.issuesTasks || 0],
                  backgroundColor: ['#1890ff', '#52c41a', '#ff4d4f'],
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        )}

        {activeChart === 'worker' && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Tasks per Worker</Title>
            {(stats.userStats || []).length > 0 ? (
              <Bar
                data={{
                  labels: stats.userStats.filter(u => (u.totalTasks || 0) > 0).map(u => u.user || u.name || 'Unknown'),
                  datasets: [{
                    label: 'Tasks',
                    data: stats.userStats.filter(u => (u.totalTasks || 0) > 0).map(u => u.totalTasks || u.taskCount || u.count || 0),
                    backgroundColor: '#1890ff',
                  }]
                }}
                options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
              />
            ) : (
              <Text type="secondary">No worker data available</Text>
            )}
          </div>
        )}

        {activeChart === 'completion' && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Completion Rate</Title>
            <Pie
              data={{
                labels: ['Completed', 'In Progress'],
                datasets: [{
                  data: [
                    stats.completedTasks || 0,
                    (stats.totalTasks || 0) - (stats.completedTasks || 0)
                  ],
                  backgroundColor: ['#52c41a', '#faad14'],
                }]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SupervisorDashboard;