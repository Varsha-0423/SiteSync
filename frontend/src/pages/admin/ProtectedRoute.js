import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // If no specific roles are required, or if user's role is in allowedRoles
  if (allowedRoles.length === 0 || (user && allowedRoles.includes(user.role))) {
    return children;
  }
  
  // If user doesn't have required role, redirect to dashboard or appropriate page
  return <Navigate to="/dashboard" replace />;
};

export default ProtectedRoute;
