import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // Demo accounts with correct emails from database (ALL LOWERCASE)
    const demoAccounts = [
        // Admin
        { 
            email: 'admin@example.com', 
            password: 'admin123', 
            name: 'Admin', 
            role: 'admin',
            studentId: null
        },
        // Mentor
        { 
            email: 'mentor@example.com', 
            password: 'mentor123', 
            name: 'Mentor', 
            role: 'mentor',
            studentId: null
        },
        // Students (emails match database - ALL LOWERCASE)
        { 
            email: 'vijay@example.com', 
            password: 'student123', 
            name: 'Vijay', 
            role: 'student',
            studentId: 278
        }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Convert email to lowercase for case-insensitive comparison
        const lowerEmail = email.toLowerCase();
        const account = demoAccounts.find(
            acc => acc.email.toLowerCase() === lowerEmail && acc.password === password
        );

        if (account) {
            login({ 
                name: account.name, 
                email: account.email, 
                role: account.role,
                studentId: account.studentId
            });
            
            if (account.studentId) {
                localStorage.setItem('studentId', account.studentId);
            }
            
            navigate('/dashboard');
        } else {
            setError('Invalid credentials. Check the demo accounts below.');
        }
    };

    // Filter accounts by role for display
    const adminAccounts = demoAccounts.filter(a => a.role === 'admin');
    const mentorAccounts = demoAccounts.filter(a => a.role === 'mentor');
    const studentAccounts = demoAccounts.filter(a => a.role === 'student');

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-700">🎓 Student 360</h1>
                    <p className="text-gray-600 mt-2">Student Monitoring System</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Login
                    </button>
                </form>

                <div className="mt-6 text-sm text-gray-600 border-t pt-4">
                    <p className="font-semibold text-center mb-2">📋 Demo Accounts:</p>
                    
                    <div className="space-y-3">
                        {/* Admin Accounts */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">🔑 Admin</p>
                            {adminAccounts.map(acc => (
                                <div key={acc.email} className="flex justify-between items-center bg-gray-50 p-1 rounded text-xs">
                                    <span className="text-indigo-600 font-medium">{acc.email}</span>
                                    <span className="text-gray-400">{acc.password}</span>
                                </div>
                            ))}
                        </div>

                        {/* Mentor Accounts */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">👨‍🏫 Mentor</p>
                            {mentorAccounts.map(acc => (
                                <div key={acc.email} className="flex justify-between items-center bg-gray-50 p-1 rounded text-xs">
                                    <span className="text-blue-600 font-medium">{acc.email}</span>
                                    <span className="text-gray-400">{acc.password}</span>
                                </div>
                            ))}
                        </div>

                        {/* Student Accounts */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">🎓 Student</p>
                            <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                                {studentAccounts.map(acc => (
                                    <div key={acc.email} className="flex justify-between items-center bg-green-50 p-1 rounded text-xs">
                                        <span className="text-green-600 font-medium">{acc.email}</span>
                                        <span className="text-gray-500">{acc.password}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;