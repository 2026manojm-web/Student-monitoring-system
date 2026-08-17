import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Layout from '../components/Layout';

const StudentParticipation = () => {
    const [student, setStudent] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newActivity, setNewActivity] = useState({
        activity_name: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Sports',
        hours: 1
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const categories = ['Sports', 'Cultural', 'Academic', 'Social Service', 'Tech', 'Arts', 'Leadership'];

    useEffect(() => {
        // Get the logged-in user's student ID
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        // For demo, use student ID 1 (Arun Kumar - LOW risk student)
        // In real app, this would come from the user's profile
        const studentId = 1; // Default to Arun Kumar
        fetchStudentData(studentId);
    }, []);

    const fetchStudentData = async (studentId) => {
        try {
            const [studentRes, activitiesRes] = await Promise.all([
                API.get(`/students/${studentId}`),
                API.get(`/students/${studentId}/activities`)
            ]);
            setStudent(studentRes.data);
            // If no activities endpoint exists, use mock data
            setActivities(activitiesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Use mock data if API fails
            setStudent({
                id: 1,
                name: 'Arun Kumar',
                roll_number: 'S021',
                department: 'Computer Science',
                section: 'A',
                year: 3
            });
            setActivities([
                { id: 1, activity_name: 'Tech Symposium', date: '2026-02-15', category: 'Tech', hours: 4 },
                { id: 2, activity_name: 'Sports Day', date: '2026-01-20', category: 'Sports', hours: 6 },
                { id: 3, activity_name: 'Cultural Fest', date: '2026-03-10', category: 'Cultural', hours: 5 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitActivity = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            // In real implementation, this would POST to /students/{id}/activities
            // For now, we'll add to local state
            const newAct = {
                id: Date.now(),
                ...newActivity,
                student_id: student.id
            };
            setActivities([newAct, ...activities]);
            setNewActivity({
                activity_name: '',
                date: new Date().toISOString().split('T')[0],
                category: 'Sports',
                hours: 1
            });
            setShowForm(false);
            setMessage('✅ Activity added successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error adding activity:', error);
            setMessage('❌ Error adding activity. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Sports': 'bg-green-100 text-green-800',
            'Cultural': 'bg-purple-100 text-purple-800',
            'Academic': 'bg-blue-100 text-blue-800',
            'Social Service': 'bg-red-100 text-red-800',
            'Tech': 'bg-indigo-100 text-indigo-800',
            'Arts': 'bg-pink-100 text-pink-800',
            'Leadership': 'bg-yellow-100 text-yellow-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    // Calculate total participation hours
    const totalHours = activities.reduce((sum, act) => sum + (act.hours || 1), 0);
    const activityCount = activities.length;

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-xl text-gray-500">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-wrap justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">🎯 My Participation</h1>
                            <p className="text-gray-600 mt-1">
                                {student?.name} • {student?.roll_number} • {student?.department}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Total Activities</div>
                            <div className="text-3xl font-bold text-indigo-600">{activityCount}</div>
                            <div className="text-sm text-gray-500">Total Hours</div>
                            <div className="text-xl font-bold text-indigo-400">{totalHours}h</div>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {message && (
                    <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                {/* Add Activity Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`px-4 py-2 rounded-lg text-white font-semibold transition flex items-center space-x-2 ${
                            showForm ? 'bg-gray-600 hover:bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        <span>{showForm ? '✕' : '➕'}</span>
                        <span>{showForm ? 'Cancel' : 'Add Activity'}</span>
                    </button>
                </div>

                {/* Add Activity Form */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">📝 Log New Activity</h3>
                        <form onSubmit={handleSubmitActivity} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Activity Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newActivity.activity_name}
                                        onChange={(e) => setNewActivity({...newActivity, activity_name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g., Tech Symposium, Sports Day"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={newActivity.category}
                                        onChange={(e) => setNewActivity({...newActivity, category: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        required
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={newActivity.date}
                                        onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hours Spent
                                    </label>
                                    <input
                                        type="number"
                                        min="0.5"
                                        max="24"
                                        step="0.5"
                                        value={newActivity.hours}
                                        onChange={(e) => setNewActivity({...newActivity, hours: parseFloat(e.target.value) || 1})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {submitting ? 'Logging...' : '✅ Log Activity'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Activity List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">📋 My Activities</h2>
                        <span className="text-sm text-gray-500">{activities.length} activities</span>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {activities.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                No activities logged yet. Start participating!
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition">
                                    <div className="flex flex-wrap justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">
                                                {activity.category === 'Sports' ? '⚽' :
                                                 activity.category === 'Cultural' ? '🎭' :
                                                 activity.category === 'Academic' ? '📚' :
                                                 activity.category === 'Social Service' ? '🤝' :
                                                 activity.category === 'Tech' ? '💻' :
                                                 activity.category === 'Arts' ? '🎨' : '🌟'}
                                            </span>
                                            <div>
                                                <p className="font-semibold">{activity.activity_name}</p>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(activity.category)}`}>
                                                        {activity.category}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(activity.date).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {activity.hours || 1}h
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete this activity?')) {
                                                        setActivities(activities.filter(a => a.id !== activity.id));
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Participation Summary */}
                {activities.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-indigo-800 mb-3">📊 Participation Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-indigo-600">{totalHours}</div>
                                <div className="text-xs text-gray-500">Total Hours</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-green-600">{activityCount}</div>
                                <div className="text-xs text-gray-500">Total Activities</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {[...new Set(activities.map(a => a.category))].length}
                                </div>
                                <div className="text-xs text-gray-500">Categories</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {(totalHours / (activities.length || 1)).toFixed(1)}
                                </div>
                                <div className="text-xs text-gray-500">Avg Hours/Activity</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default StudentParticipation;