import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Layout from '../components/Layout';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showBulkNote, setShowBulkNote] = useState(false);
    const [bulkNote, setBulkNote] = useState('');
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '',
        email: '',
        roll_number: '',
        department: '',
        section: 'A',
        year: 1,
        mentor_id: 1
    });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // If student, redirect to dashboard
            if (user.role === 'student') {
                navigate('/dashboard');
                return;
            }
            
            const response = await API.get('/students');
            setStudents(response.data);
            setFilteredStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = students;
        
        if (search) {
            filtered = filtered.filter(s => 
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.roll_number.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        if (riskFilter) {
            filtered = filtered.filter(s => s.risk_level === riskFilter);
        }
        
        setFilteredStudents(filtered);
        setSelectedStudents([]);
    }, [search, riskFilter, students]);

    const selectAll = () => {
        if (selectedStudents.length === filteredStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudents.map(s => s.id));
        }
    };

    const toggleStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(s => s !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    // ===== REAL DELETE FUNCTION =====
    const handleDeleteStudents = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        const confirmDelete = window.confirm(
            `⚠️ Are you sure you want to permanently delete ${selectedStudents.length} student(s)?\n\nThis action cannot be undone!`
        );

        if (!confirmDelete) return;

        try {
            setSubmitting(true);
            let deletedCount = 0;
            
            // Delete each selected student
            for (const id of selectedStudents) {
                try {
                    const response = await API.delete(`/students/${id}`);
                    if (response.status === 200) {
                        deletedCount++;
                    }
                } catch (error) {
                    console.error(`Error deleting student ${id}:`, error);
                }
            }
            
            alert(`✅ Successfully deleted ${deletedCount} student(s)`);
            setSelectedStudents([]);
            await fetchStudents(); // Refresh the list
            
        } catch (error) {
            console.error('Error during deletion:', error);
            alert('❌ Error deleting students. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ===== REAL ADD STUDENT FUNCTION =====
    const handleAddStudent = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate inputs
            if (!newStudent.name || !newStudent.email || !newStudent.roll_number) {
                alert('Please fill in all required fields');
                setSubmitting(false);
                return;
            }

            const response = await API.post('/students', newStudent);
            
            if (response.status === 200 || response.status === 201) {
                alert(`✅ Student "${newStudent.name}" added successfully!`);
                setNewStudent({
                    name: '',
                    email: '',
                    roll_number: '',
                    department: '',
                    section: 'A',
                    year: 1,
                    mentor_id: 1
                });
                setShowAddStudent(false);
                await fetchStudents(); // Refresh the list
            }
        } catch (error) {
            console.error('Error adding student:', error);
            if (error.response?.status === 400) {
                alert('❌ Error: ' + error.response.data.detail);
            } else {
                alert('❌ Error adding student. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        if (action === 'note') {
            setShowBulkNote(true);
        } else if (action === 'export') {
            const selectedData = filteredStudents.filter(s => selectedStudents.includes(s.id));
            const headers = ['Name', 'Roll Number', 'Department', 'Attendance', 'Grade', 'Risk Level', 'Risk Score'];
            const rows = selectedData.map(s => [
                s.name,
                s.roll_number,
                s.department,
                s.attendance_percentage?.toFixed(1) || 'N/A',
                s.average_grade?.toFixed(1) || 'N/A',
                s.risk_level || 'N/A',
                s.risk_score?.toFixed(1) || 'N/A'
            ]);
            
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `selected_students_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            alert(`✅ Exported ${selectedStudents.length} students`);
            setSelectedStudents([]);
        } else if (action === 'delete') {
            handleDeleteStudents();
        }
    };

    const submitBulkNote = async () => {
        if (!bulkNote.trim()) {
            alert('Please enter a note');
            return;
        }

        try {
            for (const id of selectedStudents) {
                await API.post(`/students/${id}/notes`, {
                    student_id: parseInt(id),
                    mentor_id: 1,
                    note: `[BULK ACTION] ${bulkNote}`,
                    action_taken: 'Bulk note added',
                    follow_up_date: null
                });
            }
            alert(`✅ Note added to ${selectedStudents.length} students`);
            setShowBulkNote(false);
            setBulkNote('');
            setSelectedStudents([]);
            fetchStudents();
        } catch (error) {
            console.error('Error adding bulk note:', error);
            alert('Error adding notes. Please try again.');
        }
    };

    const getRiskColor = (level) => {
        if (level === 'HIGH') return 'bg-red-100 text-red-800';
        if (level === 'MEDIUM') return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
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

    return (
        <Layout>
            <div className="space-y-6">
                {/* Add Student Modal */}
                {showAddStudent && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">➕ Add New Student</h3>
                                <button
                                    onClick={() => setShowAddStudent(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="Enter student name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={newStudent.email}
                                        onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Roll Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStudent.roll_number}
                                        onChange={(e) => setNewStudent({...newStudent, roll_number: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g., S031"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department *
                                    </label>
                                    <select
                                        value={newStudent.department}
                                        onChange={(e) => setNewStudent({...newStudent, department: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Civil">Civil</option>
                                        <option value="Electrical">Electrical</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Section
                                        </label>
                                        <select
                                            value={newStudent.section}
                                            onChange={(e) => setNewStudent({...newStudent, section: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Year
                                        </label>
                                        <select
                                            value={newStudent.year}
                                            onChange={(e) => setNewStudent({...newStudent, year: parseInt(e.target.value)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value={1}>1st Year</option>
                                            <option value={2}>2nd Year</option>
                                            <option value={3}>3rd Year</option>
                                            <option value={4}>4th Year</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {submitting ? 'Adding...' : '✅ Add Student'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bulk Action Modal */}
                {showBulkNote && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">📝 Add Bulk Note</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Adding note to {selectedStudents.length} selected student(s)
                            </p>
                            <textarea
                                value={bulkNote}
                                onChange={(e) => setBulkNote(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                                rows="3"
                                placeholder="Enter your note for all selected students..."
                                autoFocus
                            />
                            <div className="flex justify-end space-x-3 mt-4">
                                <button
                                    onClick={() => {
                                        setShowBulkNote(false);
                                        setBulkNote('');
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitBulkNote}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                                >
                                    Add Note to All
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters and Bulk Actions */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by name or roll number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <select
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">All Risk Levels</option>
                                <option value="HIGH">High Risk</option>
                                <option value="MEDIUM">Medium Risk</option>
                                <option value="LOW">Low Risk</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowAddStudent(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
                        >
                            <span>➕</span>
                            <span>Add Student</span>
                        </button>
                    </div>

                    {/* Bulk Actions Bar */}
                    {filteredStudents.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-3">
                            <button 
                                onClick={selectAll}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                                {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <span className="text-sm text-gray-500">
                                {selectedStudents.length} of {filteredStudents.length} selected
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => handleBulkAction('note')}
                                    disabled={selectedStudents.length === 0}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                                        selectedStudents.length === 0
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    📝 Add Note
                                </button>
                                <button 
                                    onClick={() => handleBulkAction('export')}
                                    disabled={selectedStudents.length === 0}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                                        selectedStudents.length === 0
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                >
                                    📥 Export
                                </button>
                                <button 
                                    onClick={() => handleBulkAction('delete')}
                                    disabled={selectedStudents.length === 0 || submitting}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                                        selectedStudents.length === 0 || submitting
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                >
                                    🗑️ Remove
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">All Students</h2>
                        <span className="text-sm text-gray-500">{filteredStudents.length} students</span>
                    </div>
                    <div className="overflow-x-auto">
                        {filteredStudents.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No students found.</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                                            <input 
                                                type="checkbox"
                                                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                                onChange={selectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => toggleStudent(student.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                <div className="flex items-center">
                                                    {student.risk_level === 'HIGH' && (
                                                        <span className="text-red-500 mr-2">🚨</span>
                                                    )}
                                                    {student.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{student.roll_number}</td>
                                            <td className="px-6 py-4">{student.department}</td>
                                            <td className="px-6 py-4">{student.attendance_percentage?.toFixed(1) || 0}%</td>
                                            <td className="px-6 py-4">{student.average_grade?.toFixed(1) || 0}%</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(student.risk_level)}`}>
                                                    {student.risk_level || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/student/${student.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
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
            </div>
        </Layout>
    );
};

export default Students;