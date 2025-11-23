import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme } from 'antd';
import {
  CheckSquareOutlined,
  LogoutOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

const SupervisorNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Determine which menu item should be selected based on the current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('assign-tasks')) return '1';
    if (path.includes('submit-work')) return '2';
    return '1'; // Default to assign tasks
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
          <Menu.Item key="1" icon={<CheckSquareOutlined />}>
            <NavLink to="/supervisor/assign-tasks">Assign Tasks</NavLink>
          </Menu.Item>
          {/* <Menu.Item key="2" icon={<UploadOutlined />}>
            <NavLink to="/supervisor/submit-work">Submit Work</NavLink>
          </Menu.Item> */}
        </Menu>
      </div>
      <Button 
        type="text" 
        icon={<LogoutOutlined />} 
        onClick={handleLogout}
        style={{ color: 'rgba(0, 0, 0, 0.65)' }}
      >
        Logout
      </Button>
    </Header>
  );
};

export default SupervisorNavbar;
