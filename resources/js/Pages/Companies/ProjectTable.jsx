import React from 'react';
import { 
    FolderKanban, 
    Calendar, 
    Clock, 
    CheckCircle, 
    PlayCircle,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';

const ProjectTable = ({ data }) => {
    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Calculate days left
    const calculateDaysLeft = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Status badge
    const getStatusBadge = (status, deadline) => {
        const daysLeft = calculateDaysLeft(deadline);
        
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                    </span>
                );
            case 'in_progress':
                if (daysLeft < 0) {
                    return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Overdue
                        </span>
                    );
                } else if (daysLeft <= 7) {
                    return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-4 h-4 mr-1" />
                            Due Soon ({daysLeft}d)
                        </span>
                    );
                } else {
                    return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <PlayCircle className="w-4 h-4 mr-1" />
                            In Progress
                        </span>
                    );
                }
            case 'delayed':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Delayed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    // Days left badge
    const getDaysLeftBadge = (deadline) => {
        const daysLeft = calculateDaysLeft(deadline);
        
        if (daysLeft < 0) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    {Math.abs(daysLeft)} days overdue
                </span>
            );
        } else if (daysLeft === 0) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Due today
                </span>
            );
        } else if (daysLeft <= 7) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {daysLeft} days left
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {daysLeft} days left
                </span>
            );
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Project List</h2>
                <p className="text-gray-600">All projects for this company</p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#e2e8f0]">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <FolderKanban className="w-4 h-4 mr-2" />
                                    Project Description
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Start Date
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Deadline
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Time Left
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Progress
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">
                                        {project.project_description}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatDate(project.start_date)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {formatDate(project.deadline)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getDaysLeftBadge(project.deadline)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(project.status, project.deadline)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className={`h-2.5 rounded-full ${
                                                    project.status === 'completed' ? 'bg-green-600' :
                                                    calculateDaysLeft(project.deadline) < 0 ? 'bg-red-600' :
                                                    'bg-blue-600'
                                                }`}
                                                style={{ 
                                                    width: project.status === 'completed' ? '100%' : 
                                                    calculateDaysLeft(project.deadline) < 0 ? '100%' : '65%' 
                                                }}
                                            ></div>
                                        </div>
                                        <span className="ml-2 text-sm text-gray-600">
                                            {project.status === 'completed' ? '100%' : 
                                            calculateDaysLeft(project.deadline) < 0 ? 'Overdue' : '65%'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Projects</p>
                        <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {data.filter(p => p.status === 'completed').length}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">In Progress</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {data.filter(p => p.status === 'in_progress').length}
                        </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Overdue/Delayed</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {data.filter(p => p.status === 'delayed' || calculateDaysLeft(p.deadline) < 0).length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTable;