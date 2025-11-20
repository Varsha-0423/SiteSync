import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import AdminNavbar from './AdminNavbar';

const { Content } = Layout;

const AdminLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AdminNavbar />
      <Layout>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: '80vh' }}>
            {children || <Outlet />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
