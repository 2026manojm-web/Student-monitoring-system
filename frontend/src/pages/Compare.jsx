import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Layout from '../components/Layout';

const Compare = () => {
    const [students, setStudents] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await API.get('/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (student) => {
        if (selected.find(s => s.id === student.id)) {
            setSelected(selected.filter(s => s.id !== student.id));
        } else if (selected.length < 4) {
            setSelected([...selected, student]);
        } else {
            alert('You can compare up to 4 students at a time');
        }
    };

    const clearSelection = () => {
        setSelected([]);
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
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">📊 Compare Students</h2>
                    {selected.length > 0 && (
                        <button 
                            onClick={clearSelection}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Clear All ({selected.length})
                        </button>
                    )}
                </div>
                
                {/* Student Selection */}
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Select up to 4 students to compare:
                        <span className="text-xs text-gray-400 ml-2">({selected.length}/4 selected)</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2">
                        {students.map(student => {
                            const isSelected = selected.find(s => s.id === student.id);
                            return (
                                <button
                                    key={student.id}
                                    onClick={() => toggleStudent(student)}
                                    className={`px-3 py-2 rounded-lg text-sm transition ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    } ${selected.length >= 4 && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={selected.length >= 4 && !isSelected}
                                >
                                    {student.name}
                                    {isSelected && <span className="ml-1">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selected.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-6xl mb-4">👆</div>
                        <h3 className="text-xl font-semibold text-gray-700">Select Students to Compare</h3>
                        <p className="text-gray-500 mt-2">Choose up to 4 students from the list above to compare their performance</p>
                    </div>
                )}

                {selected.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selected.map(student => (
                            <div 
                                key={student.id} 
                                className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer"
                                onClick={() => navigate(`/student/${student.id}`)}
                            >
                                <h4 className="font-semibold text-indigo-600">{student.name}</h4>
                                <div className="mt-2 space-y-1 text-sm">
                                    <p className="flex justify-between">
                                        <span className="text-gray-500">Roll:</span>
                                        <span>{student.roll_number}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-gray-500">Attendance:</span>
                                        <span className="font-medium">{student.attendance_percentage?.toFixed(1) || 0}%</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-gray-500">Grade:</span>
                                        <span className="font-medium">{student.average_grade?.toFixed(1) || 0}%</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-gray-500">Risk:</span>
                                        <span className={`font-bold ${
                                            student.risk_level === 'HIGH' ? 'text-red-600' :
                                            student.risk_level === 'MEDIUM' ? 'text-yellow-600' :
                                            'text-green-600'
                                        }`}>
                                            {student.risk_level || 'N/A'}
                                        </span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-gray-500">Risk Score:</span>
                                        <span className="font-bold">{student.risk_score?.toFixed(1) || 0}/100</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Compare;