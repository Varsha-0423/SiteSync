import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import AdminCreateUser from "./pages/admin/AdminCreateUser";
import UserDetails from "./pages/admin/UserDetails";
import WorkerSubmit from "./pages/WorkerSubmit";
import ProtectedRoute from "./pages/admin/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminUploadExcel from "./pages/admin/AdminUploadExcel";
import TaskAssignment from "./pages/admin/TaskAssignment";
import AdminTodayTasks from "./pages/admin/AdminTodayTasks";
import SupervisorTaskAssignment from "./pages/supervisor/SupervisorTaskAssignment";
import SupervisorLayout from "./pages/supervisor/SupervisorLayout";

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated 
                ? <Navigate to="/dashboard" replace /> 
                : <Navigate to="/login" replace /> 
            } 
          />
          
          {/* Public routes */}
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/worker/submit" 
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerSubmit />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="create-user" replace />} />
            <Route path="create-user" element={<AdminCreateUser />} />
            <Route path="upload-tasks" element={<AdminUploadExcel />} />
            <Route path="assign-tasks" element={<TaskAssignment />} />
            <Route path="today-tasks" element={<AdminTodayTasks />} />
            <Route path="*" element={<Navigate to="create-user" replace />} />
          </Route>
          
          {/* Supervisor routes */}
          <Route 
            path="/supervisor" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="assign-tasks" replace />} />
            <Route path="assign-tasks" element={<SupervisorTaskAssignment />} />
            <Route path="*" element={<Navigate to="assign-tasks" replace />} />
          </Route>
          
          {/* User details route */}
          <Route 
            path="/user/:userId" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                <AdminLayout>
                  <UserDetails />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
