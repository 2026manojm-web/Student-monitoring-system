import axios from 'axios';

const API = axios.create({
    baseURL: 'https://student-monitoring-backend-7b20.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add auth token and student ID
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add student_id to params if user is a student
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'student' && user.studentId) {
            // For GET requests, add to params
            if (config.method === 'get') {
                config.params = {
                    ...config.params,
                    student_id: user.studentId
                };
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default API;