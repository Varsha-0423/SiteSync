import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Spin,
  message,
  Badge,
  List,
  Tag,
  Progress
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FileOutlined
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { getWorkerTasks, updateTaskStatus } from "../../services/workerService";

const { Title, Text } = Typography;

function WorkerDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  useEffect(() => {
    fetchWorkerTasks();
  }, [activeTab]);

  const fetchWorkerTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await getWorkerTasks(currentUser.id, activeTab);

      setTasks(tasksData);

      setStats({
        assigned: tasksData.filter((t) => t.status === "assigned").length,
        inProgress: tasksData.filter((t) => t.status === "inProgress").length,
        completed: tasksData.filter((t) => t.status === "completed").length,
        overdue: tasksData.filter((t) => t.status === "overdue").length,
      });
    } catch (error) {
      message.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId, action) => {
    try {
      setLoading(true);

      const updateStatus =
        action === "start" ? "inProgress" : action === "complete" ? "completed" : action;

      await updateTaskStatus(taskId, { status: updateStatus });

      message.success(`Task updated to ${updateStatus}`);
      fetchWorkerTasks();
    } catch (error) {
      message.error("Failed to update task");
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge status="success" text="Completed" />;
      case "inProgress":
        return <Badge status="processing" text="In Progress" />;
      case "overdue":
        return <Badge status="error" text="Overdue" />;
      case "assigned":
      default:
        return <Badge status="default" text="Assigned" />;
    }
  };

  const getPriorityTag = (priority) => {
    const colorMap = {
      high: "red",
      medium: "orange",
      low: "green",
    };
    return <Tag color={colorMap[priority] || "default"}>{priority}</Tag>;
  };

  const getTaskIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "inProgress":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "overdue":
        return <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <FileOutlined />;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* WELCOME CARD */}
      <Card
        style={{
          background: "linear-gradient(135deg, #5b89c7 0%, #3a5a80 100%)",
          color: "white",
          marginBottom: "24px",
        }}
        bordered={false}
      >
        <Title level={3} style={{ color: "white" }}>
          Welcome back, {currentUser?.name || "Worker"}!
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.8)" }}>
          Here’s your task summary.
        </Text>
      </Card>

      {/* TASK STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center" }}>
              <FileOutlined style={{ fontSize: "24px", marginRight: "12px" }} />
              <div>
                <div>Total</div>
                <div style={{ fontSize: "22px" }}>{tasks.length}</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center" }}>
              <CheckCircleOutlined style={{ fontSize: "24px", color: "#52c41a", marginRight: "12px" }} />
              <div>
                <div>Completed</div>
                <div style={{ fontSize: "22px" }}>{stats.completed}</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center" }}>
              <ClockCircleOutlined style={{ fontSize: "24px", color: "#faad14", marginRight: "12px" }} />
              <div>
                <div>In Progress</div>
                <div style={{ fontSize: "22px" }}>{stats.inProgress}</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ display: "flex", alignItems: "center" }}>
              <ExclamationCircleOutlined style={{ fontSize: "24px", color: "#ff4d4f", marginRight: "12px" }} />
              <div>
                <div>Overdue</div>
                <div style={{ fontSize: "22px" }}>{stats.overdue}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* TASK LIST */}
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>My Tasks</span>

            <div>
              <Button
                type={activeTab === "all" ? "primary" : "default"}
                size="small"
                onClick={() => setActiveTab("all")}
                style={{ marginRight: 8 }}
              >
                All
              </Button>

              <Button
                type={activeTab === "inProgress" ? "primary" : "default"}
                size="small"
                onClick={() => setActiveTab("inProgress")}
                style={{ marginRight: 8 }}
              >
                In Progress
              </Button>

              <Button
                type={activeTab === "completed" ? "primary" : "default"}
                size="small"
                onClick={() => setActiveTab("completed")}
              >
                Completed
              </Button>
            </div>
          </div>
        }
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin />
          </div>
        ) : tasks.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={tasks}
            renderItem={(task) => (
              <List.Item
                actions={[
                  task.status === "assigned" && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleTaskAction(task._id, "start")}
                    >
                      Start Task
                    </Button>
                  ),
                  task.status === "inProgress" && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleTaskAction(task._id, "complete")}
                    >
                      Mark Complete
                    </Button>
                  ),
                  <Button type="link" size="small">View Details</Button>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={getTaskIcon(task.status)}
                  title={
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span>{task.title}</span>
                      <span style={{ marginLeft: 10 }}>{getPriorityTag(task.priority)}</span>
                    </div>
                  }
                  description={
                    <>
                      <div>{task.description}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Text>
                      <div style={{ marginTop: 5 }}>{getStatusBadge(task.status)}</div>
                    </>
                  }
                />

                <Progress
                  type="circle"
                  percent={task.progress || 0}
                  width={50}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <FileDoneOutlined style={{ fontSize: 50, color: "#d9d9d9" }} />
            <p>No tasks found</p>
            <Text type="secondary">
              {activeTab === "all"
                ? "You have no tasks yet."
                : `No ${activeTab} tasks found.`}
            </Text>
          </div>
        )}
      </Card>
    </div>
  );
}

export default WorkerDashboard;
