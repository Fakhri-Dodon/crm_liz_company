import React, { useState } from 'react';
import { 
    FolderKanban, 
    Calendar, 
    Clock, 
    CheckCircle, 
    PlayCircle, 
    MoreVertical, 
    Edit, 
    Trash2,
    XCircle,
    PauseCircle,
    AlertTriangle
} from 'lucide-react';

const ProjectTable = ({ data, onEdit, onDelete }) => {
    const [actionMenu, setActionMenu] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const calculateDaysLeft = (deadline) => {
        if (!deadline) return 0;
        try {
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
        switch(status) {
            case 'in_progress':
            case 'progress':
            case 'active':
            case 'on_progress':
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                        <PlayCircle className="w-3 h-3 mr-1" />
                        In Progress
                    </span>
                );
            case 'completed':
            case 'done':
            case 'finished':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </span>
                );
            case 'pending':
            case 'draft':
            case 'new':
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                        <PauseCircle className="w-3 h-3 mr-1" />
                        Pending
                    </span>
                );
            case 'cancelled':
            case 'canceled':
            case 'rejected':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800`}>
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelled
                    </span>
                );
            case 'delayed':
            case 'overdue':
                return (
                    <span className={`${baseClasses} bg-orange-100 text-orange-800`}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Delayed
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {status}
                    </span>
                );
        }
    };

    const getDaysLeftText = (daysLeft, status) => {
        // Jika status sudah completed atau cancelled, tampilkan status saja
        if (status === 'completed' || status === 'done' || status === 'finished') {
            return 'Completed';
        }
        if (status === 'cancelled' || status === 'canceled' || status === 'rejected') {
            return 'Cancelled';
        }
        if (status === 'delayed' || status === 'overdue') {
            return 'Overdue';
        }
        
        // Jika ada daysLeft dari backend, gunakan itu
        if (daysLeft !== null && daysLeft !== undefined) {
            if (daysLeft < 0) return `${Math.abs(daysLeft)}d late`;
            if (daysLeft === 0) return 'Today';
            if (daysLeft === 1) return 'Tomorrow';
            return `${daysLeft}d left`;
        }
        
        // Jika tidak ada daysLeft dari backend, hitung manual
        if (!daysLeft && typeof daysLeft !== 'number') {
            return 'N/A';
        }
        
        return 'N/A';
    };

    const getDaysLeftColor = (daysLeft, status) => {
        // Prioritaskan status
        if (status === 'completed' || status === 'done' || status === 'finished') {
            return 'text-green-800 bg-green-100';
        }
        if (status === 'cancelled' || status === 'canceled' || status === 'rejected') {
            return 'text-red-800 bg-red-100';
        }
        if (status === 'delayed' || status === 'overdue') {
            return 'text-orange-800 bg-orange-100';
        }
        
        // Gunakan daysLeft untuk menentukan warna
        if (daysLeft !== null && daysLeft !== undefined) {
            if (daysLeft < 0) return 'text-red-800 bg-red-100';
            if (daysLeft <= 7) return 'text-yellow-800 bg-yellow-100';
            return 'text-green-800 bg-green-100';
        }
        
        return 'text-gray-800 bg-gray-100';
    };

    const toggleActionMenu = (index) => {
        setActionMenu(actionMenu === index ? null : index);
    };

    // Mobile Card View
    const MobileCardView = ({ project, index }) => {
        const daysLeft = project.days_left !== undefined ? project.days_left : calculateDaysLeft(project.deadline);
        
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start space-x-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <FolderKanban className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                        {index + 1}. {project.project_description?.substring(0, 60) || 'No Description'}
                                        {project.project_description?.length > 60 && '...'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-xs text-gray-500 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            Start: {formatDate(project.start_date)}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Deadline: {formatDate(project.deadline)}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => toggleActionMenu(index)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {actionMenu === index && (
                                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                            <button
                                                onClick={() => {
                                                    onEdit(project);
                                                    setActionMenu(null);
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                            >
                                                <Edit className="w-3 h-3 mr-2" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDelete(project);
                                                    setActionMenu(null);
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center"
                                            >
                                                <Trash2 className="w-3 h-3 mr-2" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                                <div className={`px-2 py-1 rounded text-xs ${getDaysLeftColor(daysLeft, project.status)}`}>
                                    {getDaysLeftText(daysLeft, project.status)}
                                </div>
                                {getStatusBadge(project.status)}
                            </div>
                            
                            {project.note && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                    <span className="font-medium">Note:</span> {project.note}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Mobile View */}
            <div className="sm:hidden">
                {data.map((project, index) => (
                    <MobileCardView key={project.id || index} project={project} index={index} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    No
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Project Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Start Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Deadline
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Time Left
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Note
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((project, index) => {
                                const daysLeft = project.days_left !== undefined ? project.days_left : calculateDaysLeft(project.deadline);
                                
                                return (
                                    <tr key={project.id || index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 max-w-[300px]">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {project.project_description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(project.start_date)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(project.deadline)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs ${getDaysLeftColor(daysLeft, project.status)}`}>
                                                {getDaysLeftText(daysLeft, project.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {getStatusBadge(project.status)}
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <div className="text-sm text-gray-600 truncate" title={project.note}>
                                                {project.note || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => onEdit(project)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit project"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(project)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete project"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            {data.length === 0 && (
                <div className="text-center py-12">
                    <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-600">This company doesn't have any projects yet.</p>
                </div>
            )}

            {/* Summary */}
            {data.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Projects</p>
                            <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.filter(p => 
                                    p.status === 'completed' || 
                                    p.status === 'done' || 
                                    p.status === 'finished'
                                ).length}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.filter(p => 
                                    p.status === 'pending' || 
                                    p.status === 'draft' || 
                                    p.status === 'new'
                                ).length}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Cancelled</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.filter(p => 
                                    p.status === 'cancelled' || 
                                    p.status === 'canceled' || 
                                    p.status === 'rejected'
                                ).length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectTable;