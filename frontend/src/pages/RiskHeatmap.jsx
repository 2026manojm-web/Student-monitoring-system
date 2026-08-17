import React from 'react';

const RiskHeatmap = ({ students }) => {
    // Group students by department and risk level
    const departments = [...new Set(students.map(s => s.department))];
    const riskLevels = ['HIGH', 'MEDIUM', 'LOW'];
    
    const getColor = (count, total) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        if (percentage > 50) return 'bg-red-600';
        if (percentage > 25) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔥 Risk Heatmap by Department</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 text-left">Department</th>
                            {riskLevels.map(level => (
                                <th key={level} className={`px-4 py-2 text-center ${
                                    level === 'HIGH' ? 'text-red-600' :
                                    level === 'MEDIUM' ? 'text-yellow-600' :
                                    'text-green-600'
                                }`}>
                                    {level}
                                </th>
                            ))}
                            <th className="px-4 py-2 text-center">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map(dept => {
                            const deptStudents = students.filter(s => s.department === dept);
                            const counts = riskLevels.map(level => 
                                deptStudents.filter(s => s.risk_level === level).length
                            );
                            const total = deptStudents.length;
                            
                            return (
                                <tr key={dept} className="border-t">
                                    <td className="px-4 py-2 font-medium">{dept}</td>
                                    {counts.map((count, idx) => (
                                        <td key={idx} className="px-4 py-2">
                                            <div className={`${getColor(count, total)} text-white text-center rounded px-2 py-1`}>
                                                {count}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="px-4 py-2 text-center font-bold">{total}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RiskHeatmap;