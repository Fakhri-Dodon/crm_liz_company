import React from 'react';

const StatCard = ({ title, value, color, icon, iconColor, trend }) => {
    return (
        <div className={`rounded-xl p-6 ${color} transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <div className={`inline-flex items-center mt-2 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                            <span className="ml-1 text-gray-500">from last month</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${iconColor} bg-opacity-20`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;