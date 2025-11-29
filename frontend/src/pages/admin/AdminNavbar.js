import React, { useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  UserAddOutlined,
  UploadOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Determine which menu item should be selected based on the current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return '1';
    if (path.includes('create-user')) return '2';
    if (path.includes('upload-tasks')) return '3';
    if (path.includes('schedule-tasks')) return '4';
    return '1'; // Default to dashboard
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
    <Header style={{ 
      position: 'sticky',
      top: 0,
      zIndex: 1,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      background: colorBgContainer,
      padding: '0 20px',
      boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
    }}>
      <div className="logo" style={{ 
        color: '#1890ff', 
        fontWeight: 'bold',
        fontSize: '20px',
        marginRight: '24px'
      }}>
        Admin Panel
      </div>
      <Menu
        theme="light"
        mode="horizontal"
        selectedKeys={[getSelectedKey()]}
        style={{ flex: 1, borderBottom: 'none' }}
      >
        <Menu.Item key="1" icon={<DashboardOutlined />}>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </Menu.Item>
        <Menu.Item key="2" icon={<UserAddOutlined />}>
          <NavLink to="/admin/create-user">Create User</NavLink>
        </Menu.Item>
        <Menu.Item key="3" icon={<UploadOutlined />}>
          <NavLink to="/admin/upload-tasks">Upload Tasks</NavLink>
        </Menu.Item>
        {/* Task assignment is now handled by supervisors
        <Menu.Item key="4" icon={<CheckSquareOutlined />}>
          <NavLink to="/admin/assign-tasks">Assign Tasks</NavLink>
        </Menu.Item>
        */}
        <Menu.Item key="4" icon={<CalendarOutlined />}>
          <NavLink to="/admin/schedule-tasks">Schedule Tasks</NavLink>
        </Menu.Item>
      </Menu>
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

export default AdminNavbar;
