import React, { useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Typography, theme } from 'antd';
import {
  CheckSquareOutlined,
  LogoutOutlined,
    DashboardOutlined,
  UserOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header } = Layout;

const { Text } = Typography;

const SupervisorNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Determine which menu item should be selected based on the current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return '2';
    if (path.includes('assign-tasks')) return '1';
    if (path.includes('submit-work')) return '2';
    return '2'; // Default to dashboard
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<ProfileOutlined />}>
        <NavLink to="/profile">My Profile</NavLink>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Header
      style={{
        padding: '0 24px',
        background: colorBgContainer,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: '0 24px 0 0', color: '#1890ff', fontWeight: 'bold' }}>
          Task Manager
        </h2>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          style={{ 
            flex: 1, 
            minWidth: 0,
            borderBottom: 'none',
            backgroundColor: 'transparent'
          }}
        >
          <Menu.Item key="2" icon={<DashboardOutlined />}>
            <NavLink to="/supervisor/dashboard">Dashboard</NavLink>
          </Menu.Item>
          {/* <Menu.Item key="1" icon={<CheckSquareOutlined />}>
            <NavLink to="/supervisor/assign-tasks">Assign Tasks</NavLink>
          </Menu.Item>
           */}
        </Menu>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
            <Avatar 
              size="default" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff', marginRight: '8px' }}
            />
            <Text strong style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
              {currentUser?.name || currentUser?.email || 'User'}
            </Text>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default SupervisorNavbar;
