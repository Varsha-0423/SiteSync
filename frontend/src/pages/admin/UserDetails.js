import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  Descriptions, 
  Button, 
  Spin, 
  message, 
  Typography, 
  Space,
  Tag,
  Row,
  Col,
  Divider
} from "antd";
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
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
      console.log('Fetching user with ID:', userId);
      
      if (!userId || userId === 'undefined') {
        throw new Error('Invalid user ID');
      }
      
      const response = await api.get(`/users/${userId}`);
      console.log('User details response:', response.data);
      
      if (response.data) {
        // Check both response formats that might come from the backend
        const userData = response.data.data || response.data;
        if (userData) {
          setUser(userData);
          return;
        }
      }
      throw new Error('Invalid user data received');
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

  const getRoleColor = (role) => {
    if (!role) return 'default';
    switch (role) {
      case 'admin': return 'red';
      case 'supervisor': return 'blue';
      case 'worker': return 'green';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" tip="Loading user details..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <Title level={4} type="secondary">User not found</Title>
            <Text type="secondary">The user you're looking for doesn't exist or you don't have permission to view it.</Text>
            <br />
            <Button 
              type="primary" 
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/admin/create-user')}
            >
              Back to Users
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/admin/create-user')}
          >
            Back to Users
          </Button>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => {
              message.info('Edit functionality coming soon!');
            }}
          >
            Edit User
          </Button>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* User Profile Card */}
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <UserOutlined style={{ fontSize: '48px', color: 'white' }} />
              </div>
              <Title level={2} style={{ margin: 0, color: '#262626' }}>
                {user.name || 'Unknown User'}
              </Title>
              <Tag 
                color={getRoleColor(user.role)} 
                style={{ marginTop: '12px', padding: '4px 12px', fontSize: '14px' }}
              >
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown Role'}
              </Tag>
            </div>
            
            <Divider />
            
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>USER ID</Text>
                  <br />
                  <Text code style={{ fontSize: '11px' }}>{user._id}</Text>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* User Information */}
        <Col xs={24} md={16}>
          <Card title={<><UserOutlined /> User Information</>} style={{ marginBottom: '24px' }}>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item 
                label={<><UserOutlined /> Full Name</>}
                span={2}
              >
                <Text strong>{user.name || 'N/A'}</Text>
              </Descriptions.Item>

              <Descriptions.Item 
                label={<><MailOutlined /> Email Address</>}
                span={2}
              >
                <Text code>{user.email || 'N/A'}</Text>
              </Descriptions.Item>

              <Descriptions.Item 
                label={<><TeamOutlined /> Role</>}
              >
                <Tag color={getRoleColor(user.role)}>
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item 
                label={<><ClockCircleOutlined /> Status</>}
              >
                <Tag color="green">Active</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Timeline Information */}
          <Card title={<><CalendarOutlined /> Timeline Information</>}>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item 
                label="Account Created"
              >
                <Space>
                  <CalendarOutlined />
                  <Text>{formatDate(user.createdAt)}</Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item 
                label="Last Updated"
              >
                <Space>
                  <ClockCircleOutlined />
                  <Text>{formatDate(user.updatedAt)}</Text>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item 
                label="Account Age"
                span={2}
              >
                {user.createdAt ? (
                  <Text>
                    {Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))} days
                  </Text>
                ) : (
                  <Text type="secondary">N/A</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Additional Information */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card title="System Information" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    {user.role || 'N/A'}
                  </Title>
                  <Text type="secondary">User Role</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                    Active
                  </Title>
                  <Text type="secondary">Account Status</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={3} style={{ margin: 0, color: '#faad14' }}>
                    {user.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
                  </Title>
                  <Text type="secondary">Member Since</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default UserDetails;
