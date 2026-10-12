import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { ProtectedRoute } from './components/Protection';

import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import NewComplaint from './pages/NewComplaint';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaintDetail from './pages/AdminComplaintDetail';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminComplaintDetail from './pages/SuperAdminComplaintDetail';
import Departments from './pages/Departments';
import AdminUsers from './pages/AdminUsers';
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/super" replace />;
  }
  if (user.role === 'DEPARTMENT_ADMIN' || user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/citizen" replace />;
};

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Citizen Routes */}
          <Route
            path="/citizen"
            element={
              <ProtectedRoute requiredRole="CITIZEN">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-complaint"
            element={
              <ProtectedRoute requiredRole="CITIZEN">
                <NewComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaint/:id"
            element={
              <ProtectedRoute requiredRole="CITIZEN">
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="DEPARTMENT_ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints/:id"
            element={
              <ProtectedRoute requiredRole="DEPARTMENT_ADMIN">
                <AdminComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="/admin/super"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/super/complaints/:id"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <SuperAdminComplaintDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/super/departments"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/super/users"
            element={
              <ProtectedRoute requiredRole="SUPER_ADMIN">
                <AdminUsers />
              </ProtectedRoute>
            }
          />


          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        Academic prototype — not an official Bhopal municipal service.
      </footer>
    </div>
  );
};

export default App;
