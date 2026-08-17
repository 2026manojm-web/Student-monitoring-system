import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import Layout from '../components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [grades, setGrades] = useState([]);
    const [notes, setNotes] = useState([]);
    const [riskData, setRiskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [prediction, setPrediction] = useState(null);
    const [predicting, setPredicting] = useState(false);
    const [newNote, setNewNote] = useState({
        mentor_id: 1,
        note: '',
        action_taken: '',
        follow_up_date: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStudentData();
    }, [id]);

    const fetchStudentData = async () => {
        try {
            const [studentRes, attendanceRes, gradesRes, riskRes, notesRes] = await Promise.all([
                API.get(`/students/${id}`),
                API.get(`/students/${id}/attendance`),
                API.get(`/students/${id}/grades`),
                API.get(`/students/${id}/risk`),
                API.get(`/students/${id}/notes`)
            ]);
            setStudent(studentRes.data);
            setAttendance(attendanceRes.data);
            setGrades(gradesRes.data);
            setRiskData(riskRes.data);
            setNotes(notesRes.data);
        } catch (error) {
            console.error('Error fetching student data:', error);
            if (error.response?.status === 404) {
                navigate('/students');
            }
        } finally {
            setLoading(false);
        }
    };

    const predictRisk = async () => {
        setPredicting(true);
        try {
            const response = await API.get(`/students/${id}/predict`);
            setPrediction(response.data);
        } catch (error) {
            console.error('Error predicting risk:', error);
            alert('Error getting AI prediction. Make sure backend is running.');
        } finally {
            setPredicting(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.post(`/students/${id}/notes`, {
                ...newNote,
                student_id: parseInt(id)
            });
            setNewNote({ mentor_id: 1, note: '', action_taken: '', follow_up_date: '' });
            await fetchStudentData();
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getRiskColor = (level) => {
        if (level === 'HIGH') return 'bg-red-100 text-red-800';
        if (level === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const getRiskBadgeClass = (level) => {
        if (level === 'HIGH') return 'bg-red-500';
        if (level === 'MEDIUM') return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPredictionColor = (level) => {
        if (level === 'HIGH') return 'text-red-600';
        if (level === 'MEDIUM') return 'text-yellow-600';
        return 'text-green-600';
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="text-xl text-gray-500">Loading student data...</div>
                </div>
            </Layout>
        );
    }

    if (!student) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-700">Student not found</h2>
                    <button
                        onClick={() => navigate('/students')}
                        className="mt-4 text-indigo-600 hover:text-indigo-800"
                    >
                        Back to Students
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Student Header */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-wrap justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{student.name}</h1>
                            <div className="mt-2 text-gray-600 space-y-1">
                                <p>Roll Number: {student.roll_number}</p>
                                <p>Department: {student.department} | Section: {student.section} | Year: {student.year}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Risk Score</div>
                            <div className="text-4xl font-bold">{riskData?.total_score?.toFixed(1) || 0}/100</div>
                            <div className="mt-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getRiskBadgeClass(riskData?.risk_level)}`}>
                                    {riskData?.risk_level || 'N/A'} RISK
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* AI Prediction Button */}
                    <div className="mt-4 flex items-center space-x-4">
                        <button
                            onClick={predictRisk}
                            disabled={predicting}
                            className={`px-4 py-2 rounded-lg text-white font-semibold transition flex items-center space-x-2 ${
                                predicting ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                        >
                            <span>🔮</span>
                            <span>{predicting ? 'Predicting...' : 'AI Predict Risk'}</span>
                        </button>
                        {prediction && (
                            <span className="text-sm text-gray-500">
                                Last prediction: {new Date().toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* AI Prediction Results */}
                {prediction && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                            <span className="mr-2">🤖</span> AI Risk Prediction
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-sm text-gray-600">Current Risk</div>
                                <div className="text-xl font-bold">{prediction.current_risk}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-sm text-gray-600">Predicted Risk</div>
                                <div className={`text-xl font-bold ${getPredictionColor(prediction.predicted_risk)}`}>
                                    {prediction.predicted_risk}
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-sm text-gray-600">Confidence</div>
                                <div className="text-xl font-bold">{prediction.confidence}</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-sm text-gray-600">High Risk Probability</div>
                                <div className={`text-xl font-bold ${
                                    parseFloat(prediction.high_risk_probability) > 60 ? 'text-red-600' :
                                    parseFloat(prediction.high_risk_probability) > 30 ? 'text-yellow-600' :
                                    'text-green-600'
                                }`}>
                                    {prediction.high_risk_probability}
                                </div>
                            </div>
                        </div>
                        
                        {/* Recommendation */}
                        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                            <div className="text-sm font-semibold text-gray-700">📋 Recommendation</div>
                            <div className="mt-1">{prediction.recommendation}</div>
                            {prediction.action_required && (
                                <div className="mt-2 text-sm text-gray-600">
                                    <strong>Action Required:</strong> {prediction.action_required}
                                </div>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                                <strong>AI Analysis:</strong> {prediction.explanation}
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                <strong>Features used:</strong> Attendance: {prediction.features_used.attendance}%, 
                                Grade: {prediction.features_used.grade}%, 
                                Disciplinary: {prediction.features_used.disciplinary_count}, 
                                Activities: {prediction.features_used.activity_count}
                            </div>
                        </div>
                    </div>
                )}

                {/* Risk Factors */}
                {riskData?.explanation && riskData.explanation.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-3">⚠️ Why is this student at risk?</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                            {riskData.explanation.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Recommended Action:</strong> {riskData.recommendation}
                            </p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500">Attendance</div>
                        <div className="text-2xl font-bold">{student.attendance_percentage?.toFixed(1) || 0}%</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500">Average Grade</div>
                        <div className="text-2xl font-bold">{student.average_grade?.toFixed(1) || 0}%</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500">Disciplinary Records</div>
                        <div className="text-2xl font-bold">{student.disciplinary_count || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500">Activities</div>
                        <div className="text-2xl font-bold">{student.activity_count || 0}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Attendance Trend</h3>
                        {attendance.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">No attendance data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={attendance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="attendance_percentage" stroke="#4F46E5" name="Attendance %" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Grades Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">Grade Trend</h3>
                        {grades.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">No grade data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={grades}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="subject" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="marks" stroke="#F59E0B" name="Marks" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Mentor Notes */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">📝 Mentor Notes</h3>

                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                <textarea
                                    value={newNote.note}
                                    onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                    rows="2"
                                    required
                                    placeholder="Enter your note..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken</label>
                                    <input
                                        type="text"
                                        value={newNote.action_taken}
                                        onChange={(e) => setNewNote({ ...newNote, action_taken: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="What action was taken?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                                    <input
                                        type="date"
                                        value={newNote.follow_up_date}
                                        onChange={(e) => setNewNote({ ...newNote, follow_up_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Note'}
                            </button>
                        </div>
                    </form>

                    {/* Notes List */}
                    {notes.length === 0 ? (
                        <div className="text-gray-500 text-center py-4">No notes added yet</div>
                    ) : (
                        <div className="space-y-4">
                            {notes.map((note) => (
                                <div key={note.id} className="border-l-4 border-indigo-400 pl-4 py-2">
                                    <div className="text-sm text-gray-500">
                                        {new Date(note.date).toLocaleDateString()}
                                    </div>
                                    <p className="text-gray-700 mt-1">{note.note}</p>
                                    {note.action_taken && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            <strong>Action taken:</strong> {note.action_taken}
                                        </p>
                                    )}
                                    {note.follow_up_date && (
                                        <p className="text-sm text-gray-600">
                                            <strong>Follow-up:</strong> {new Date(note.follow_up_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default StudentProfile;