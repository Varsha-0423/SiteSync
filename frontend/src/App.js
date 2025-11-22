import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import AdminCreateUser from "./pages/admin/AdminCreateUser";
import UserDetails from "./pages/admin/UserDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminUploadExcel from "./pages/admin/AdminUploadExcel";
import TaskAssignment from "./pages/admin/TaskAssignment";
import AdminTodayTasks from "./pages/admin/AdminTodayTasks";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorLayout from "./pages/supervisor/SupervisorLayout";
import SupervisorTaskAssignment from "./pages/supervisor/SupervisorTaskAssignment";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerLayout from "./pages/worker/WorkerLayout";
import MyTasks from "./pages/worker/MyTasks";
import SubmitWork from "./pages/worker/SubmitWork";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

// Move the main app content into a separate component that uses AuthProvider
function AppContent() {
  const { currentUser } = useAuth();
  const isAuthenticated = !!localStorage.getItem('token');
  const location = useLocation();

  // Handle authentication state
  if (!isAuthenticated) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  } else if (location.pathname === '/' || location.pathname === '/login') {
    // If authenticated and on root or login, redirect to appropriate dashboard
    const userRole = currentUser?.role || 'worker';
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }

  return (
    <div className="App">
      <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated 
                ? <Navigate to={`/${currentUser?.role || 'worker'}/dashboard`} replace />
                : <Navigate to="/login" replace /> 
            } 
          />
          
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated 
                ? <Navigate to={`/${currentUser?.role || 'worker'}/dashboard`} replace /> 
                : <Login />
            } 
          />
          
          {/* Protected routes */}
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Supervisor Routes */}
          <Route 
            path="/supervisor/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorLayout>
                  <SupervisorDashboard />
                </SupervisorLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Worker Routes */}
          <Route 
            path="/worker" 
            element={
              <ProtectedRoute allowedRoles={['worker']}>
                <WorkerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="my-tasks" element={<MyTasks />} />
            <Route path="submit-work" element={<SubmitWork />} />
          </Route>
          
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
  );
}

export default App;
