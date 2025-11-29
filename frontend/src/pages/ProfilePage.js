import React from 'react';
import { Layout } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import Profile from './Profile';
import AdminLayout from './admin/AdminLayout';
import SupervisorNavbar from './supervisor/SupervisorNavbar';

const ProfilePage = () => {
  const { currentUser } = useAuth();

  if (currentUser?.role === 'admin') {
    return (
      <AdminLayout>
        <Profile />
      </AdminLayout>
    );
  }

  // For supervisor and other roles
  return (
    <Layout>
      <SupervisorNavbar />
      <Layout.Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
        <Profile />
      </Layout.Content>
    </Layout>
  );
};

export default ProfilePage;
