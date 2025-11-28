import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Spin, message, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import api from "../../api";

const { Title, Text } = Typography;

function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${userId}`, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        setUser(response.data.data);
      } else {
        throw new Error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to fetch user details. Please try again.';
      message.error(errorMessage);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" tip="Loading worker details..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "24px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/create-user")}
          style={{ marginBottom: "20px" }}
        >
          Back
        </Button>
        <Card>
          <Title level={4} type="secondary">Worker Not Found</Title>
          <Text>The worker details cannot be loaded.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/admin/create-user")}
        style={{ marginBottom: "20px" }}
      >
        Back to List
      </Button>

      <Card title="Worker Payroll Details" bordered>
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Employee ID">
            {user._id || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Name">
            {user.name || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Email">
            {user.email || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Role">
            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Code">
            {user.code || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Division">
            {user.division || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Payroll Month">
            {user.payrollMonth || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Designation">
            {user.designation || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Job">
            {user.job || "N/A"}
          </Descriptions.Item>

          <Descriptions.Item label="Days Attended">
            {user.daysAttended || 0}
          </Descriptions.Item>

          <Descriptions.Item label="OT Hours">
            {user.otHours || 0}
          </Descriptions.Item>

          <Descriptions.Item label="Net Salary">
            {user.netSalary ? `$${Number(user.netSalary).toFixed(2)}` : "$0.00"}
          </Descriptions.Item>

          <Descriptions.Item label="Fixed Cost">
            {user.fixedCost ? `$${Number(user.fixedCost).toFixed(2)}` : "$0.00"}
          </Descriptions.Item>

          <Descriptions.Item label="Total Cost">
            {user.totalCost ? `$${Number(user.totalCost).toFixed(2)}` : "$0.00"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

export default UserDetails;
