// src/pages/admin/Dashboard.js
import React, { useState, useEffect, useMemo } from "react";
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
  Menu,
  Modal,
  List,
  Tag,
  Space,
  Statistic
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { getDashboardStats, getTasks, deleteTask } from "../../services/dashboardService";
import TaskAssignment from "../../components/TaskAssignment";
import WorkerAssignment from "../../components/WorkerAssignment";

// Chart.js imports
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
    userStats: [],
    // optional backend-supplied budgetStats can be placed here
    // budgetStats: { ... }
  });
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: "all", assignedWorker: "all" });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [userRole, setUserRole] = useState("admin"); // replace with auth context

  // Chart modal state
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [activeChart, setActiveChart] = useState(null); // 'pie' | 'bar' | 'line' | 'stacked' | 'strategy'

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getDashboardStats();
      if (!response) throw new Error("No response from server");
      const data = response.data || response;

      setStats({
        totalTasks: data.totalTasks || 0,
        onScheduleTasks: data.onScheduleTasks || 0,
        behindTasks: data.behindTasks || 0,
        aheadTasks: data.aheadTasks || 0,
        completedTasks: data.completedTasks || 0,
        issuesTasks: data.issuesTasks || 0,
        pendingTasks: data.pendingTasks || 0,
        userStats: data.userStats || [],
        budgetStats: data.budgetStats || undefined // allow optional backend budget stats
      });

      const taskFilters = {};
      if (filters.status !== "all") taskFilters.status = filters.status;
      if (filters.assignedWorker !== "all") taskFilters.assignedWorker = filters.assignedWorker;
      const tasksData = await getTasks(taskFilters);
      setTasks(tasksData || []);
    } catch (err) {
      setError({ message: err.message });
      message.error(`Error: ${err.message}`);
      setStats((prev) => ({
        ...prev,
        totalTasks: 0,
        onScheduleTasks: 0,
        behindTasks: 0,
        aheadTasks: 0,
        completedTasks: 0,
        issuesTasks: 0,
        pendingTasks: 0,
        userStats: []
      }));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (value) => setFilters((prev) => ({ ...prev, status: value }));
  const handleWorkerFilterChange = (value) => setFilters((prev) => ({ ...prev, assignedWorker: value }));
  const handleTaskCreated = () => fetchDashboardData();
  const handleWorkersAssigned = () => fetchDashboardData();

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      message.success("Task deleted successfully");
      fetchDashboardData();
    } catch (err) {
      message.error("Failed to delete task");
    }
  };

  const getTaskActions = (task) => {
    const menuItems = [
      <Menu.Item key="view" icon={<EyeOutlined />}>
        <Button type="link" onClick={() => navigate(`/admin/tasks/${task._id}`)}>
          View Details
        </Button>
      </Menu.Item>
    ];
    if (userRole === "admin") {
      menuItems.push(
        <Menu.Item key="delete" icon={<DeleteOutlined />} danger>
          <Button type="link" danger onClick={() => handleDeleteTask(task._id)}>
            Delete Task
          </Button>
        </Menu.Item>
      );
    }
    return (
      <Dropdown overlay={<Menu>{menuItems}</Menu>} trigger={["click"]}>
        <Button icon={<MoreOutlined />} style={{ border: "none" }} />
      </Dropdown>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "on-schedule":
        return "#52c41a";
      case "behind":
        return "#ff4d4f";
      case "ahead":
        return "#faad14";
      case "completed":
        return "#1890ff";
      default:
        return "#d9d9d9";
    }
  };

  // ---------------- Budget calculations (frontend fallback if backend not provided) ----------------
  // Prefer backend budgetStats (if provided via stats.budgetStats)
  const backendBudget = stats?.budgetStats;

  // processedTasks always computed locally (used for charts)
  const processedTasks = useMemo(() => {
    return (tasks || []).map((task) => {
      const prelimsStaffs = Number(task.prelimsStaffs || 0);
      const overheadStaffs = Number(task.overheadStaffs || 0);
      const material = Number(task.material || 0);
      const equipment = Number(task.equipment || 0);
      const manpower = Number(task.manpower || 0);
      const totalBudget = prelimsStaffs + overheadStaffs + material + equipment + manpower;
      return {
        ...task,
        prelimsStaffs,
        overheadStaffs,
        material,
        equipment,
        manpower,
        totalBudget,
      };
    });
  }, [tasks]);

  const totals = useMemo(() => {
    const totalBudget = processedTasks.reduce((s, t) => s + (t.totalBudget || 0), 0);
    const avgBudgetPerTask = processedTasks.length > 0 ? totalBudget / processedTasks.length : 0;
    const mostExpensiveTask = processedTasks.reduce(
      (max, t) => (t.totalBudget > max.totalBudget ? t : max),
      { taskName: "-", totalBudget: 0 }
    );
    const categoryTotals = {
      prelimsStaffs: processedTasks.reduce((s, t) => s + (t.prelimsStaffs || 0), 0),
      overheadStaffs: processedTasks.reduce((s, t) => s + (t.overheadStaffs || 0), 0),
      material: processedTasks.reduce((s, t) => s + (t.material || 0), 0),
      equipment: processedTasks.reduce((s, t) => s + (t.equipment || 0), 0),
      manpower: processedTasks.reduce((s, t) => s + (t.manpower || 0), 0),
    };
    const mostExpensiveCategory = Object.keys(categoryTotals).reduce(
      (acc, k) => {
        if (categoryTotals[k] > acc.amount) return { name: k, amount: categoryTotals[k] };
        return acc;
      },
      { name: "-", amount: 0 }
    );
    return { totalBudget, avgBudgetPerTask, mostExpensiveTask, categoryTotals, mostExpensiveCategory };
  }, [processedTasks]);

  // If backend provided, prefer it (keeps compatibility)
  const displayTotals = backendBudget
    ? {
        totalBudget: backendBudget.totalBudget || 0,
        avgBudgetPerTask: backendBudget.avgBudgetPerTask || 0,
        mostExpensiveTask: backendBudget.mostExpensiveTask || { name: "-", budget: 0 },
        categoryTotals: backendBudget.categoryTotals || totals.categoryTotals,
        mostExpensiveCategory: backendBudget.mostExpensiveCategory || totals.mostExpensiveCategory,
      }
    : {
        totalBudget: totals.totalBudget,
        avgBudgetPerTask: totals.avgBudgetPerTask,
        mostExpensiveTask: { name: totals.mostExpensiveTask.taskName || "-", budget: totals.mostExpensiveTask.totalBudget || 0 },
        categoryTotals: totals.categoryTotals,
        mostExpensiveCategory: totals.mostExpensiveCategory,
      };

  // categoryTotals array for pie chart
  const categoryTotalsArray = [
    { name: "Prelims Staffs", value: Number(displayTotals.categoryTotals.prelimsStaffs || 0) },
    { name: "Overheads", value: Number(displayTotals.categoryTotals.overheadStaffs || 0) },
    { name: "Material", value: Number(displayTotals.categoryTotals.material || 0) },
    { name: "Equipment", value: Number(displayTotals.categoryTotals.equipment || 0) },
    { name: "Manpower", value: Number(displayTotals.categoryTotals.manpower || 0) },
  ];

  // Chart datasets
  const pieData = {
    labels: categoryTotalsArray.map((c) => c.name),
    datasets: [
      {
        data: categoryTotalsArray.map((c) => c.value),
        backgroundColor: ["#1890ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1"],
        borderWidth: 1,
      },
    ],
  };

  const barPerTaskData = {
    labels: processedTasks.map((t) => t.taskName || "Untitled"),
    datasets: [
      {
        label: "Total Budget",
        data: processedTasks.map((t) => t.totalBudget || 0),
        backgroundColor: "#1890ff",
      },
    ],
  };

  // Line: budget trend by date (group by date)
  const lineData = useMemo(() => {
    // group budgets by startDate or date field (use date || startDate)
    const map = new Map();
    processedTasks.forEach((t) => {
      const d = t.date || t.startDate || null;
      // normalize date label
      const label = d ? new Date(d).toLocaleDateString() : "No Date";
      map.set(label, (map.get(label) || 0) + (t.totalBudget || 0));
    });
    const labels = Array.from(map.keys());
    const data = Array.from(map.values());
    return {
      labels,
      datasets: [
        {
          label: "Total Budget",
          data,
          borderColor: "#1890ff",
          fill: false,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }, [processedTasks]);

  // Stacked bar: category breakdown per task
  const stackedBarData = {
    labels: processedTasks.map((t) => t.taskName || "Untitled"),
    datasets: [
      {
        label: "Prelims",
        data: processedTasks.map((t) => t.prelimsStaffs || 0),
        backgroundColor: "#1890ff",
      },
      {
        label: "Overheads",
        data: processedTasks.map((t) => t.overheadStaffs || 0),
        backgroundColor: "#52c41a",
      },
      {
        label: "Material",
        data: processedTasks.map((t) => t.material || 0),
        backgroundColor: "#faad14",
      },
      {
        label: "Equipment",
        data: processedTasks.map((t) => t.equipment || 0),
        backgroundColor: "#722ed1",
      },
      {
        label: "Manpower",
        data: processedTasks.map((t) => t.manpower || 0),
        backgroundColor: "#ff4d4f",
      },
    ],
  };

  // Strategy-based totals
  const strategyTotals = useMemo(() => {
    const internal = processedTasks.filter((t) => t.strategy === "internal").reduce((s, t) => s + (t.totalBudget || 0), 0);
    const manpower = processedTasks.filter((t) => t.strategy === "manpower").reduce((s, t) => s + (t.totalBudget || 0), 0);
    const subContract = processedTasks.filter((t) => t.strategy === "sub contract" || t.strategy === "subcontract").reduce((s, t) => s + (t.totalBudget || 0), 0);
    return { internal, manpower, subContract };
  }, [processedTasks]);

  const strategyData = {
    labels: ["Internal", "Manpower", "Sub Contract"],
    datasets: [
      {
        label: "Total Budget",
        data: [strategyTotals.internal, strategyTotals.manpower, strategyTotals.subContract],
        backgroundColor: ["#52c41a", "#faad14", "#ff4d4f"],
      },
    ],
  };

  // Chart options for stacked
  const stackedOptions = {
    responsive: true,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  // Compact chart card height and modal sizes
  const compactChartCardStyle = { cursor: "pointer", height: 220 };
  const compactChartOptions = { maintainAspectRatio: false, responsive: true };

  // Recent activity (simple mock: using latest tasks changes). If you have a real activity feed, replace this.
  const recentActivities = (tasks || [])
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.date || 0) - new Date(a.updatedAt || a.date || 0))
    .slice(0, 6);

  // ---------------- JSX ----------------
  return (
    <div style={{ padding: "20px" }}>
      {/* PAGE TITLE */}
      <div style={{ background: "#5b89c7", padding: "26px 30px", borderRadius: 8, color: "white" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title style={{ color: "white", marginBottom: 0 }}>Task Dashboard</Title>
            <Text style={{ color: "white" }}>Monitor tasks, budgets, and progress in real-time</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchDashboardData}>Refresh</Button>
              {userRole === "admin" && <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowTaskModal(true)}>Create Task</Button>}
            </Space>
          </Col>
        </Row>
      </div>

      <br />

      {/* TOP STAT CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #52c41a" }}>
            <Statistic title="Total Tasks" value={stats?.totalTasks || 0} />
            <Text type="secondary">All tasks in system</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #1890ff" }}>
            <Statistic title="Completed" value={stats?.completedTasks || 0} />
            <Text type="secondary">Tasks finished</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #ff4d4f" }}>
            <Statistic title="Issues" value={stats?.issuesTasks || 0} />
            <Text type="secondary">Tasks with problems</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #faad14" }}>
            <Statistic title="Pending" value={stats?.pendingTasks || 0} />
            <Text type="secondary">Not started</Text>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* SMALL CHARTS (compact & clickable) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card
            title="Budget Distribution"
            hoverable
            style={compactChartCardStyle}
            onClick={() => {
              setActiveChart("pie");
              setChartModalOpen(true);
            }}
          >
            <div style={{ height: 150 }}>
              <Pie data={pieData} options={compactChartOptions} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Click to enlarge</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title="Budget per Task"
            hoverable
            style={compactChartCardStyle}
            onClick={() => {
              setActiveChart("bar");
              setChartModalOpen(true);
            }}
          >
            <div style={{ height: 150 }}>
              <Bar data={barPerTaskData} options={{ ...compactChartOptions, plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Click to enlarge</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title="Strategy-wise Budget"
            hoverable
            style={compactChartCardStyle}
            onClick={() => {
              setActiveChart("strategy");
              setChartModalOpen(true);
            }}
          >
            <div style={{ height: 150 }}>
              <Bar data={strategyData} options={{ ...compactChartOptions, plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Click to enlarge</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* BUDGET ANALYSIS CARDS */}
      <Title level={4}>Budget Analysis</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #1890ff" }}>
            <Title level={3} style={{ marginBottom: 0 }}>AED {Number(displayTotals.totalBudget || 0).toLocaleString()}</Title>
            <Text>Total Budget</Text>
            <p style={{ marginTop: 6 }}>Sum of all tasks</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #52c41a" }}>
            <Title level={3} style={{ marginBottom: 0 }}>AED {Math.round(Number(displayTotals.avgBudgetPerTask || 0)).toLocaleString()}</Title>
            <Text>Average Task</Text>
            <p style={{ marginTop: 6 }}>Average budget per task</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #faad14" }}>
            <Title level={4} style={{ marginBottom: 0 }}>{displayTotals.mostExpensiveTask?.name || "-"}</Title>
            <Text>Highest Budget Task</Text>
            <p style={{ marginTop: 6 }}>AED {Number(displayTotals.mostExpensiveTask?.budget || 0).toLocaleString()}</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderLeft: "4px solid #ff4d4f" }}>
            <Title level={4} style={{ marginBottom: 0 }}>{displayTotals.mostExpensiveCategory?.name || "-"}</Title>
            <Text>Most Expensive Category</Text>
            <p style={{ marginTop: 6 }}>AED {Number(displayTotals.mostExpensiveCategory?.amount || 0).toLocaleString()}</p>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* DETAILED ANALYTICS (line, stacked bar) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Budget Trend Over Time (Line)">
            <div style={{ height: 220 }}>
              <Line data={lineData} options={{ maintainAspectRatio: false }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Category Breakdown Per Task (Stacked)">
            <div style={{ height: 220 }}>
              <Bar data={stackedBarData} options={stackedOptions} />
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* RECENT ACTIVITY + TASK LIST */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Recent Activity">
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              locale={{ emptyText: "No recent activities" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.taskName}</Text>}
                    description={
                      <>
                        <Text type="secondary">{item.status ? item.status.replace("-", " ") : "No status"}</Text>
                        <div style={{ marginTop: 6 }}>
                          <Text type="secondary" style={{ marginRight: 8 }}>
                            {item.date ? new Date(item.date).toLocaleDateString() : "No Date"}
                          </Text>
                          <Tag color={getStatusColor(item.status)}>{(item.priority || "N/A").toUpperCase()}</Tag>
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={`All Tasks (${tasks.length})`}
            extra={
              <div style={{ display: "flex", gap: 8 }}>
                <Select value={filters.status} onChange={handleStatusFilterChange} style={{ width: 150 }}>
                  <Select.Option value="all">All Statuses</Select.Option>
                  <Select.Option value="on-schedule">On Schedule</Select.Option>
                  <Select.Option value="behind">Behind</Select.Option>
                  <Select.Option value="ahead">Ahead</Select.Option>
                  <Select.Option value="completed">Completed</Select.Option>
                </Select>
                <Select value={filters.assignedWorker} onChange={handleWorkerFilterChange} style={{ width: 150 }}>
                  <Select.Option value="all">All Employees</Select.Option>
                  {stats?.userStats?.map((u, i) => (
                    <Select.Option key={i} value={u.user}>
                      {u.user}
                    </Select.Option>
                  ))}
                </Select>
                <Button onClick={fetchDashboardData}>Refresh</Button>
              </div>
            }
          >
            {loading ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
              </div>
            ) : tasks.length > 0 ? (
              tasks.map((task) => (
                <Card key={task._id} style={{ marginBottom: 12 }}>
                  <Row justify="space-between" align="middle">
                    <Col xs={24} sm={16}>
                      <Title level={5} style={{ marginBottom: 6 }}>{task.taskName}</Title>
                      <Text>{task.description}</Text>
                      <div style={{ marginTop: 10 }}>
                        <Text strong>Assigned to:</Text>{" "}
                        <Text>{task.assignedWorkers?.map((w) => w.name).join(", ") || "Unassigned"}</Text>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <Text strong>Due:</Text>{" "}
                        <Text>{task.date ? new Date(task.date).toLocaleDateString() : "No due date"}</Text>
                      </div>
                    </Col>

                    <Col xs={24} sm={8} style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                        <Button
                          type="primary"
                          style={{
                            backgroundColor: getStatusColor(task.status),
                            borderColor: getStatusColor(task.status),
                          }}
                        >
                          {task.status ? task.status.replace("-", " ").toUpperCase() : "PENDING"}
                        </Button>
                        {getTaskActions(task)}
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))
            ) : (
              <Card>
                <Text type="secondary">No tasks found matching the current filters.</Text>
              </Card>
            )}
          </Card>
        </Col>
      </Row>

      {/* Fullscreen Chart Modal */}
      <Modal
        open={chartModalOpen}
        onCancel={() => setChartModalOpen(false)}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 24, minHeight: "60vh" }}
      >
        {/* Enlarged charts */}
        {activeChart === "pie" && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Budget Distribution by Category</Title>
            <Pie data={pieData} options={{ maintainAspectRatio: false }} />
          </div>
        )}

        {activeChart === "bar" && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Budget per Task</Title>
            <Bar data={barPerTaskData} options={{ maintainAspectRatio: false }} />
          </div>
        )}

        {activeChart === "line" && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Budget Trend Over Time</Title>
            <Line data={lineData} options={{ maintainAspectRatio: false }} />
          </div>
        )}

        {activeChart === "stacked" && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Category Breakdown Per Task</Title>
            <Bar data={stackedBarData} options={{ ...stackedOptions, maintainAspectRatio: false }} />
          </div>
        )}

        {activeChart === "strategy" && (
          <div style={{ height: "70vh" }}>
            <Title level={4}>Budget by Strategy</Title>
            <Bar data={strategyData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        )}
      </Modal>

      {/* Task/Worker Modals */}
      <TaskAssignment visible={showTaskModal} onClose={() => setShowTaskModal(false)} onSuccess={handleTaskCreated} />
      <WorkerAssignment visible={showWorkerModal} onClose={() => setShowWorkerModal(false)} onSuccess={handleWorkersAssigned} />
    </div>
  );
}

export default Dashboard;
