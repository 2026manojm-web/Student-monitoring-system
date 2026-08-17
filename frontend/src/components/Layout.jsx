import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Build navigation based on user role
    const navItems = [];

    // Dashboard - show for all users
    navItems.push({ path: '/dashboard', label: 'Dashboard', icon: '📊' });

    // Students - only for admin and mentor
    if (user?.role === 'admin' || user?.role === 'mentor') {
        navItems.push({ path: '/students', label: 'Students', icon: '👨‍🎓' });
    }

    // Compare - only for admin and mentor
    if (user?.role === 'admin' || user?.role === 'mentor') {
        navItems.push({ path: '/compare', label: 'Compare', icon: '📈' });
    }

    // My Activities - ONLY for students
    if (user?.role === 'student') {
        navItems.push({ path: '/participation', label: 'My Activities', icon: '🎯' });
    }

    // Admin Panel - only for admin
    if (user?.role === 'admin') {
        navItems.push({ path: '/admin', label: 'Admin Panel', icon: '⚙️' });
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-indigo-700 text-white flex flex-col">
                <div className="p-4 text-xl font-bold border-b border-indigo-600">
                    🎓 Student Monitor
                </div>
                <nav className="flex-1 p-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition ${
                                location.pathname === item.path
                                    ? 'bg-indigo-800'
                                    : 'hover:bg-indigo-600'
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-indigo-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold">{user?.name || 'User'}</div>
                            <div className="text-xs opacity-75">
                                {user?.role === 'admin' ? 'Admin' : 
                                 user?.role === 'mentor' ? 'Mentor' : 
                                 'Student'}
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-700">
                        {location.pathname === '/dashboard' && 'Dashboard'}
                        {location.pathname === '/students' && 'Students'}
                        {location.pathname === '/compare' && 'Compare Students'}
                        {location.pathname === '/participation' && 'My Activities'}
                        {location.pathname === '/admin' && 'Admin Panel'}
                        {location.pathname.startsWith('/student/') && 'Student Profile'}
                    </h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                            {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;