import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Admin from './pages/Admin';
import Compare from './pages/Compare';
import StudentParticipation from './pages/StudentParticipation';

// Protected Route component with role checking
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    
    // If specific roles are required, check them
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* Dashboard - accessible by all */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            
            {/* Students - only admin and mentor */}
            <Route
                path="/students"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'mentor']}>
                        <Students />
                    </ProtectedRoute>
                }
            />
            
            {/* Compare - only admin and mentor */}
            <Route
                path="/compare"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'mentor']}>
                        <Compare />
                    </ProtectedRoute>
                }
            />
            
            {/* Student Profile - only admin and mentor */}
            <Route
                path="/student/:id"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'mentor']}>
                        <StudentProfile />
                    </ProtectedRoute>
                }
            />
            
            {/* Admin Panel - only admin */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Admin />
                    </ProtectedRoute>
                }
            />
            
            {/* My Activities - only students */}
            <Route
                path="/participation"
                element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <StudentParticipation />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;