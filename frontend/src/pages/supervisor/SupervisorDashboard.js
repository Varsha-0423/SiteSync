import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Typography, Divider, Spin } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined, WarningOutlined, FileTextOutlined, TeamOutlined, BarChartOutlined } from "@ant-design/icons";
import { getDashboardStats } from "../../services/dashboardService";

const { Title, Text } = Typography;

function SupervisorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    issuesTasks: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response?.data) {
        setStats(response.data);
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


      {/* Recent Activity */}
      <Title level={4}> Recent Activity</Title>
      <Card>
        {[
          "Task #A204 completed by John Doe",
          "Issue reported by worker in Task #A198",
          "Task #A230 assigned to Rakesh"
        ].map((activity, i) => (
          <div key={i} style={{ padding: "12px 0", borderBottom: i < 2 ? "1px solid #f0f0f0" : "none", display: "flex", justifyContent: "space-between" }}>
            <Text>{activity}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>1h ago</Text>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default SupervisorDashboard;
