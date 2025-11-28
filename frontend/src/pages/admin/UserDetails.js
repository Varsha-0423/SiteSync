import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Descriptions, Button, Spin, message, Typography, Divider, Tag } from "antd";
import { 
  ArrowLeftOutlined, 
  UserOutlined, 
  MailOutlined, 
  IdcardOutlined,
  BankOutlined,
  CalendarOutlined,
  CrownOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalculatorOutlined
} from "@ant-design/icons";
import api from "../../api";

const { Title, Text } = Typography;

// Styled components
const PageContainer = ({ children }) => (
  <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <Divider orientation="left" style={{ fontSize: '18px', fontWeight: '500', margin: '24px 0 16px 0' }}>
    {children}
  </Divider>
);

const StyledCard = ({ children, ...props }) => (
  <Card 
    {...props} 
    style={{ 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    }}
  >
    {children}
  </Card>
);

function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Fetching user with ID:', userId); // Debug log
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setUser(null);
      
      console.log(`Making API call to: /users/${userId}`); // Debug log
      const response = await api.get(`/users/${userId}`);
      console.log('API Response:', response.data); // Debug log

      if (response.data && response.data.success) {
        setUser(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to fetch user details. Please try again.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px' }}
        >
          Back to Users
        </Button>
        <StyledCard>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={4} style={{ color: '#ff4d4f' }}>Worker Not Found</Title>
            <p>We couldn't find the worker you're looking for.</p>
            <Button 
              type="primary" 
              onClick={() => navigate(-1)}
              style={{ marginTop: '16px' }}
            >
              Return to Users List
            </Button>
          </div>
        </StyledCard>
      </PageContainer>
    );
  }

  const renderStatusTag = (role) => {
    let color = 'default';
    switch(role) {
      case 'admin':
        color = 'red';
        break;
      case 'supervisor':
        color = 'blue';
        break;
      case 'worker':
        color = 'green';
        break;
      default:
        color = 'default';
    }
    return (
      <Tag color={color} style={{ textTransform: 'capitalize' }}>
        {role}
      </Tag>
    );
  };

  return (
    <PageContainer>
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px' }}
      >
        Back to Users
      </Button>
      
      <StyledCard 
        title={
          <>
            <UserOutlined style={{ marginRight: '8px' }} />
            Worker Details
          </>
        }
        loading={loading}
      >
        <SectionTitle>
          <IdcardOutlined style={{ marginRight: '8px' }} />
          Personal Information
        </SectionTitle>
        <Descriptions bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label={
            <span><UserOutlined style={{ marginRight: '8px' }} />Full Name</span>
          }>
            {user.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><MailOutlined style={{ marginRight: '8px' }} />Email</span>
          }>
            {user.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><IdcardOutlined style={{ marginRight: '8px' }} />Employee Code</span>
          }>
            {user.code || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><CrownOutlined style={{ marginRight: '8px' }} />Role</span>
          }>
            {renderStatusTag(user.role)}
          </Descriptions.Item>
        </Descriptions>

        <SectionTitle>
          <BankOutlined style={{ marginRight: '8px' }} />
          Work Information
        </SectionTitle>
        <Descriptions bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label={
            <span><BankOutlined style={{ marginRight: '8px' }} />Division</span>
          }>
            {user.division || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><CalendarOutlined style={{ marginRight: '8px' }} />Payroll Month</span>
          }>
            {user.payrollMonth || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><CrownOutlined style={{ marginRight: '8px' }} />Designation</span>
          }>
            {user.designation || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><ToolOutlined style={{ marginRight: '8px' }} />Job</span>
          }>
            {user.job || '-'}
          </Descriptions.Item>
        </Descriptions>

        <SectionTitle>
          <CalculatorOutlined style={{ marginRight: '8px' }} />
          Attendance & Payroll
        </SectionTitle>
        <Descriptions bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label={
            <span><ClockCircleOutlined style={{ marginRight: '8px' }} />Days Attended</span>
          }>
            {user.daysAttended || '0'} days
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><ClockCircleOutlined style={{ marginRight: '8px' }} />OT Hours</span>
          }>
            {user.otHours || '0'} hours
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><DollarOutlined style={{ marginRight: '8px' }} />Net Salary</span>
          }>
            {user.netSalary ? `$${Number(user.netSalary).toFixed(2)}` : '$0.00'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><DollarOutlined style={{ marginRight: '8px' }} />Fixed Cost</span>
          }>
            {user.fixedCost ? `$${Number(user.fixedCost).toFixed(2)}` : '$0.00'}
          </Descriptions.Item>
          <Descriptions.Item label={
            <span><DollarOutlined style={{ marginRight: '8px' }} />Total Cost</span>
          } span={2}>
            <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
              {user.totalCost ? `$${Number(user.totalCost).toFixed(2)}` : '$0.00'}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </StyledCard>
    </PageContainer>
  );
}

export default UserDetails;
