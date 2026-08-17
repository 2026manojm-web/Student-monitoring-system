import React, { useState, useEffect } from 'react';
import API from '../api';
import Layout from '../components/Layout';

const Admin = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await API.get('/dashboard/summary');
            setSummary(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
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

    const departments = summary?.departments || [];

    return (
        <Layout>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
                
                {/* Department Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-2">📊 Department Overview</h3>
                        <div className="space-y-2">
                            {departments.map((dept) => (
                                <div key={dept} className="flex justify-between items-center border-b pb-2">
                                    <span>{dept}</span>
                                    <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-2">📈 Risk Statistics</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-red-600">High Risk</span>
                                <span className="font-bold">{summary?.high_risk || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-yellow-600">Medium Risk</span>
                                <span className="font-bold">{summary?.medium_risk || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-green-600">Low Risk</span>
                                <span className="font-bold">{summary?.low_risk || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-2">🎯 Overall Stats</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Total Students</span>
                                <span className="font-bold">{summary?.total_students || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Avg Attendance</span>
                                <span className="font-bold">{summary?.average_attendance?.toFixed(1) || 0}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Avg Grade</span>
                                <span className="font-bold">{summary?.average_grade?.toFixed(1) || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
    onClick={() => alert('📊 Generate Report - Coming Soon!')}
    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition"
>
    📊 Generate Report
</button>
<button 
    onClick={() => alert('📧 Send Alerts - Coming Soon!')}
    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
>
    📧 Send Alerts
</button>
<button 
    onClick={() => alert('👨‍🎓 Add Student - Coming Soon!')}
    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition"
>
    👨‍🎓 Add Student
</button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Admin;