import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import SupervisorNavbar from './SupervisorNavbar';

const { Content } = Layout;

const SupervisorLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <SupervisorNavbar />
      <Content
        style={{
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          minHeight: 'calc(100vh - 112px)',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
};

export default SupervisorLayout;
