import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        // Check for alerts every 30 seconds
        const interval = setInterval(checkForAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

   const fetchData = async () => {
    try {
        // Build URL with student_id if student role
        let summaryUrl = '/dashboard/summary';
        if (user?.role === 'student' && user?.studentId) {
            summaryUrl = `/dashboard/summary?student_id=${user.studentId}`;
        }
        
        console.log('Fetching summary from:', summaryUrl); // Add this debug line
        console.log('User data:', user); // Add this debug line
            
            const [summaryRes, riskRes, studentsRes] = await Promise.all([
                API.get(summaryUrl),
                API.get('/dashboard/at-risk'),
                API.get('/students')
            ]);
            setSummary(summaryRes.data);
            setAtRiskStudents(riskRes.data);
            setAllStudents(studentsRes.data);
            checkForAlerts(studentsRes.data, riskRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkForAlerts = (students = allStudents, riskStudents = atRiskStudents) => {
        const highRisk = riskStudents.filter(s => s.risk_level === 'HIGH');
        
        if (highRisk.length > 0 && !showAlert) {
            setShowAlert(true);
            setAlertMessage(`🚨 ${highRisk.length} student(s) are at HIGH RISK! Immediate attention required.`);
        } else if (highRisk.length === 0 && showAlert) {
            setShowAlert(false);
        }
    };

    const exportReport = () => {
        if (atRiskStudents.length === 0) {
            alert('No at-risk students to export');
            return;
        }
        
        // Create CSV data
        const headers = ['Name', 'Roll Number', 'Department', 'Attendance', 'Grade', 'Risk Level', 'Risk Score'];
        const rows = atRiskStudents.map(s => [
            s.name,
            s.roll_number,
            s.department,
            s.attendance?.toFixed(1) || 'N/A',
            s.average_grade?.toFixed(1) || 'N/A',
            s.risk_level,
            s.risk_score?.toFixed(1) || 'N/A'
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `risk_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setAlertMessage('✅ Report exported successfully!');
        setTimeout(() => setAlertMessage(''), 3000);
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-xl text-gray-500">Loading...</div>
                </div>
            </Layout>
        );
    }

    const stats = [
        { label: 'Total Students', value: summary?.total_students || 0, color: 'bg-blue-500' },
        { label: 'High Risk', value: summary?.high_risk || 0, color: 'bg-red-500' },
        { label: 'Medium Risk', value: summary?.medium_risk || 0, color: 'bg-yellow-500' },
        { label: 'Low Risk', value: summary?.low_risk || 0, color: 'bg-green-500' },
    ];

    const getRiskColor = (level) => {
        if (level === 'HIGH') return 'bg-red-100 text-red-800';
        if (level === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    // Check if user is student
    const isStudent = user?.role === 'student';

    return (
        <Layout>
            <div className="space-y-6">
                {/* Student Welcome Message */}
                {isStudent && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <p className="text-indigo-800">
                            👋 Welcome back, <strong>{user?.name}</strong>! Here's your personal dashboard.
                        </p>
                    </div>
                )}

                {/* Alert Banner */}
                {showAlert && !isStudent && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg animate-pulse">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">🚨</span>
                                <div>
                                    <p className="font-bold">{alertMessage}</p>
                                    <p className="text-sm text-red-600">Click on a student to view details</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAlert(false)}
                                className="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {alertMessage && !alertMessage.includes('HIGH RISK') && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
                        {alertMessage}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white rounded-lg shadow p-6 border-l-4 border-l-indigo-500 hover:shadow-lg transition"
                        >
                            <div className="text-sm text-gray-500">{stat.label}</div>
                            <div className="text-3xl font-bold">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Additional Stats */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-500">Average Attendance</div>
                            <div className="text-2xl font-bold">{summary.average_attendance?.toFixed(1) || 0}%</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-500">Average Grade</div>
                            <div className="text-2xl font-bold">{summary.average_grade?.toFixed(1) || 0}%</div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500">Export Report</div>
                                <div className="text-xs text-gray-400">Download CSV</div>
                            </div>
                            <button
                                onClick={exportReport}
                                disabled={isStudent || atRiskStudents.length === 0}
                                className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 ${
                                    isStudent || atRiskStudents.length === 0
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                <span>📥</span>
                                <span>Export</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Real-time Alerts Section - Only for Admin and Mentor */}
                {!isStudent && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold flex items-center">
                                <span className="mr-2">🔔</span> Real-time Alerts
                                {atRiskStudents.filter(s => s.risk_level === 'HIGH').length > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                        {atRiskStudents.filter(s => s.risk_level === 'HIGH').length} HIGH RISK
                                    </span>
                                )}
                            </h2>
                            <button 
                                onClick={fetchData}
                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                            >
                                ↻ Refresh
                            </button>
                        </div>
                        <div className="p-4">
                            {atRiskStudents.length === 0 ? (
                                <div className="text-center text-gray-500 py-4">
                                    ✅ No at-risk students. All students are on track!
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {atRiskStudents.map((student) => {
                                        const isHighRisk = student.risk_level === 'HIGH';
                                        return (
                                            <div 
                                                key={student.id} 
                                                className={`${
                                                    isHighRisk 
                                                        ? 'bg-red-50 border-l-4 border-red-500 hover:bg-red-100' 
                                                        : 'bg-yellow-50 border-l-4 border-yellow-500 hover:bg-yellow-100'
                                                } p-4 rounded-lg transition cursor-pointer`}
                                                onClick={() => navigate(`/student/${student.id}`)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`font-semibold ${isHighRisk ? 'text-red-800' : 'text-yellow-800'}`}>
                                                            {isHighRisk ? '🚨' : '⚠️'} {student.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {student.department} • Risk Score: {student.risk_score?.toFixed(1) || 0}/100
                                                        </p>
                                                        <div className="flex gap-2 mt-1 flex-wrap">
                                                            {student.risk_factors && student.risk_factors.filter(f => f).map((factor, idx) => (
                                                                <span key={idx} className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                                                    {factor}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            isHighRisk ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                                                        }`}>
                                                            {student.risk_level}
                                                        </span>
                                                        <span className="text-gray-400 text-sm">→</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* At-Risk Students Table - Only for Admin and Mentor */}
                {!isStudent && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">📋 At-Risk Students</h2>
                            <span className="text-sm text-gray-500">{atRiskStudents.length} students</span>
                        </div>
                        <div className="overflow-x-auto">
                            {atRiskStudents.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">No at-risk students found.</div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {atRiskStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        {student.risk_level === 'HIGH' && (
                                                            <span className="text-red-500 mr-2">🚨</span>
                                                        )}
                                                        {student.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{student.department}</td>
                                                <td className="px-6 py-4">{student.attendance?.toFixed(1) || 0}%</td>
                                                <td className="px-6 py-4">{student.average_grade?.toFixed(1) || 0}%</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(student.risk_level)}`}>
                                                        {student.risk_level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => navigate(`/student/${student.id}`)}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                    >
                                                        View Profile
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Student Personal Stats - Only for Students */}
                {isStudent && summary && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">📊 Your Performance Summary</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                                    <div className="text-sm text-gray-600">Attendance</div>
                                    <div className="text-2xl font-bold text-indigo-600">
                                        {summary.average_attendance?.toFixed(1) || 0}%
                                    </div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-sm text-gray-600">Average Grade</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {summary.average_grade?.toFixed(1) || 0}%
                                    </div>
                                </div>
                                <div className={`rounded-lg p-4 text-center ${
                                    summary.risk_level === 'HIGH' ? 'bg-red-50' :
                                    summary.risk_level === 'MEDIUM' ? 'bg-yellow-50' :
                                    'bg-green-50'
                                }`}>
                                    <div className="text-sm text-gray-600">Your Risk Level</div>
                                    <div className={`text-2xl font-bold ${
                                        summary.risk_level === 'HIGH' ? 'text-red-600' :
                                        summary.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`}>
                                        {summary.risk_level || 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <div className="text-sm text-gray-600">Department</div>
                                    <div className="text-xl font-bold text-purple-600">
                                        {summary.departments?.[0] || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Tip:</strong> Go to <strong>"My Activities"</strong> to log your extracurricular activities and improve your participation score!
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Dashboard;