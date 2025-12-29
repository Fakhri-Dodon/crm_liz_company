import React from 'react';
import { 
    FolderKanban, Calendar, Clock, CheckCircle, 
    PlayCircle, AlertTriangle, TrendingUp
} from 'lucide-react';

const ProjectTable = ({ data }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    const calculateDaysLeft = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getStatusBadge = (status, daysLeft) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs";
        
        if (status === 'completed') {
            return (
                <span className={`${baseClasses} bg-green-100 text-green-800`}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Done</span>
                </span>
            );
        }
        
        if (daysLeft < 0) {
            return (
                <span className={`${baseClasses} bg-red-100 text-red-800`}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Overdue</span>
                </span>
            );
        }
        
        if (daysLeft <= 7) {
            return (
                <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Due {daysLeft}d</span>
                </span>
            );
        }
        
        return (
            <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                <PlayCircle className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">In Progress</span>
            </span>
        );
    };

    const getDaysLeftText = (daysLeft) => {
        if (daysLeft < 0) return `${Math.abs(daysLeft)}d late`;
        if (daysLeft === 0) return 'Today';
        if (daysLeft === 1) return 'Tomorrow';
        return `${daysLeft}d left`;
    };

    // Mobile Card View
    const MobileCardView = ({ project }) => {
        const daysLeft = calculateDaysLeft(project.deadline);
        const progress = project.status === 'completed' ? 100 : 
                       daysLeft < 0 ? 100 : 65;
        
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start space-x-2">
                        <FolderKanban className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {project.project_description.length > 50 
                                    ? project.project_description.substring(0, 50) + '...'
                                    : project.project_description}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">
                                    {formatDate(project.start_date)} → {formatDate(project.deadline)}
                                </span>
                            </div>
                        </div>
                    </div>
                    {getStatusBadge(project.status, daysLeft)}
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${
                                project.status === 'completed' ? 'bg-green-600' :
                                daysLeft < 0 ? 'bg-red-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                
                <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                        daysLeft < 0 ? 'bg-red-100 text-red-800' :
                        daysLeft <= 7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        {getDaysLeftText(daysLeft)}
                    </span>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                        View Details
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Project List</h2>
                <p className="text-sm md:text-base text-gray-600">All projects for this company</p>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden">
                {data.map((project) => (
                    <MobileCardView key={project.id} project={project} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto -mx-2">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-[#e2e8f0]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Timeline
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Time Left
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Progress
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((project) => {
                                const daysLeft = calculateDaysLeft(project.deadline);
                                const progress = project.status === 'completed' ? 100 : 
                                               daysLeft < 0 ? 100 : 65;
                                
                                return (
                                    <tr key={project.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 max-w-[250px]">
                                            <div className="text-gray-900 truncate" title={project.project_description}>
                                                {project.project_description}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">
                                                {formatDate(project.start_date)} → {formatDate(project.deadline)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className={`text-xs px-2 py-1 rounded inline-block ${
                                                daysLeft < 0 ? 'bg-red-100 text-red-800' :
                                                daysLeft <= 7 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {getDaysLeftText(daysLeft)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(project.status, daysLeft)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${
                                                            project.status === 'completed' ? 'bg-green-600' :
                                                            daysLeft < 0 ? 'bg-red-600' : 'bg-blue-600'
                                                        }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="ml-2 text-xs text-gray-600">
                                                    {progress}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Projects</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Completed</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(p => p.status === 'completed').length}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">In Progress</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(p => p.status === 'in_progress').length}
                        </p>
                    </div>
                    <div className="bg-red-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Overdue/Delayed</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(p => p.status === 'delayed' || calculateDaysLeft(p.deadline) < 0).length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectTable;