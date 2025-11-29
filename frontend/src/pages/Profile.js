import React, { useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Descriptions, Typography } from 'antd';
import { UserOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';

const { Title } = Typography;

function Profile() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div>Loading user data...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>My Profile</Title>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Descriptions 
          bordered 
          column={1}
          labelStyle={{ fontWeight: 'bold', width: '200px' }}
          size="middle"
        >
          <Descriptions.Item 
            label={
              <span>
                <UserOutlined style={{ marginRight: 8 }} />
                Full Name
              </span>
            }
          >
            {currentUser.name || 'Not provided'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <span>
                <MailOutlined style={{ marginRight: 8 }} />
                Email
              </span>
            }
          >
            {currentUser.email}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <span>
                <IdcardOutlined style={{ marginRight: 8 }} />
                Role
              </span>
            }
          >
            {currentUser.role?.charAt(0).toUpperCase() + currentUser.role?.slice(1) || 'N/A'}
          </Descriptions.Item>
          
          {currentUser.phone && (
            <Descriptions.Item 
              label={
                <span>
                  <i className="fas fa-phone" style={{ marginRight: 8 }} />
                  Phone
                </span>
              }
            >
              {currentUser.phone}
            </Descriptions.Item>
          )}
          
          {currentUser.department && (
            <Descriptions.Item 
              label={
                <span>
                  <i className="fas fa-building" style={{ marginRight: 8 }} />
                  Department
                </span>
              }
            >
              {currentUser.department}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
}

export default Profile;
