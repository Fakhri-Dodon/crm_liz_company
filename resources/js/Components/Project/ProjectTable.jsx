import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import StatusModal from '@/Components/Project/StatusModal';
import { 
    Edit, 
    Trash2, 
    Calendar, 
    User, 
    FileText,
    Clock,
    MoreVertical,
    Eye,
    Plus,
    ChevronRight,
    AlertCircle,
    Building // TAMBAHKAN untuk icon company
} from 'lucide-react';

const ProjectTable = ({ 
    projects, 
    onEdit, 
    onStatusChange, 
    onDelete, 
    companies, // TAMBAHKAN prop companies
    statusOptions 
}) => {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const handleStatusClick = (project) => {
        setSelectedProject(project);
        setShowStatusModal(true);
    };

    // Function to get company name
    const getCompanyName = (companyId) => {
        if (!companies || !companyId) return 'N/A';
        const company = companies.find(c => c.id === companyId);
        return company ? company.name || company.client_code : 'N/A';
    };

    const getStatusBadge = (status) => {
        const config = {
            in_progress: {
                bg: 'bg-blue-50',
                border: 'border border-blue-200',
                text: 'text-blue-700',
                dot: 'bg-blue-500',
                label: 'In Progress'
            },
            completed: {
                bg: 'bg-green-50',
                border: 'border border-green-200',
                text: 'text-green-700',
                dot: 'bg-green-500',
                label: 'Completed'
            },
            pending: {
                bg: 'bg-yellow-50',
                border: 'border border-yellow-200',
                text: 'text-yellow-700',
                dot: 'bg-yellow-500',
                label: 'Pending'
            },
            cancelled: {
                bg: 'bg-red-50',
                border: 'border border-red-200',
                text: 'text-red-700',
                dot: 'bg-red-500',
                label: 'Cancelled'
            }
        };

        const style = config[status] || {
            bg: 'bg-gray-50',
            border: 'border border-gray-200',
            text: 'text-gray-700',
            dot: 'bg-gray-500',
            label: status
        };

        return (
            <button
                onClick={() => handleStatusClick(project)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full ${style.bg} ${style.border} cursor-pointer hover:opacity-80 transition-opacity`}
                title="Click to change status"
            >
                <div className={`w-2 h-2 rounded-full mr-2 ${style.dot}`}></div>
                <span className={`text-xs font-medium ${style.text}`}>
                    {style.label}
                </span>
            </button>
        );
    };

    const getStatusBadgeWithoutClick = (project) => {
        const config = {
            in_progress: {
                bg: 'bg-blue-50',
                border: 'border border-blue-200',
                text: 'text-blue-700',
                dot: 'bg-blue-500',
                label: 'In Progress'
            },
            completed: {
                bg: 'bg-green-50',
                border: 'border border-green-200',
                text: 'text-green-700',
                dot: 'bg-green-500',
                label: 'Completed'
            },
            pending: {
                bg: 'bg-yellow-50',
                border: 'border border-yellow-200',
                text: 'text-yellow-700',
                dot: 'bg-yellow-500',
                label: 'Pending'
            },
            cancelled: {
                bg: 'bg-red-50',
                border: 'border border-red-200',
                text: 'text-red-700',
                dot: 'bg-red-500',
                label: 'Cancelled'
            }
        };

        const style = config[project.status] || {
            bg: 'bg-gray-50',
            border: 'border border-gray-200',
            text: 'text-gray-700',
            dot: 'bg-gray-500',
            label: project.status
        };

        return (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${style.bg} ${style.border}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${style.dot}`}></div>
                <span className={`text-xs font-medium ${style.text}`}>
                    {style.label}
                </span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short'
        });
    };

    const formatDateFull = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDaysDuration = (startDate, deadline) => {
        const start = new Date(startDate);
        const end = new Date(deadline);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const calculateTimeLeft = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { 
                text: `Overdue ${Math.abs(diffDays)}d`, 
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border border-red-200',
                icon: <AlertCircle className="w-3 h-3" />
            };
        } else if (diffDays === 0) {
            return { 
                text: 'Today', 
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border border-red-200',
                icon: <AlertCircle className="w-3 h-3" />
            };
        } else if (diffDays <= 3) {
            return { 
                text: `${diffDays}d`, 
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border border-red-200',
                icon: <Clock className="w-3 h-3" />
            };
        } else if (diffDays <= 7) {
            return { 
                text: `${diffDays}d`, 
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                border: 'border border-yellow-200',
                icon: <Clock className="w-3 h-3" />
            };
        } else {
            return { 
                text: `${diffDays}d`, 
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border border-green-200',
                icon: <Clock className="w-3 h-3" />
            };
        }
    };

    if (!projects.data || projects.data.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Get started by creating your first project to track progress and deadlines.
                </p>
                <button 
                    className="px-6 py-3 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] inline-flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
                    onClick={() => window.location.reload()}
                >
                    <Plus className="w-4 h-4" />
                    Create First Project
                </button>
            </div>
        );
    }

    // Mobile View Component
    const MobileProjectCard = ({ project, index }) => {
        const timeLeft = calculateTimeLeft(project.deadline);
        const duration = calculateDaysDuration(project.start_date, project.deadline);
        const rowNumber = (projects.current_page - 1) * projects.per_page + index + 1;

        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#005954]/10 rounded-lg">
                            <span className="text-sm font-semibold text-[#005954]">{rowNumber}</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 line-clamp-1">
                                {project.project_description}
                            </h4>
                            {/* PERBAIKAN: Gunakan getCompanyName */}
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <Building className="w-3 h-3" />
                                <span>{getCompanyName(project.company_id)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleStatusClick(project)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        {getStatusBadgeWithoutClick(project)}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Start Date</div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDateFull(project.start_date)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Deadline</div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDateFull(project.deadline)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${timeLeft.bg} ${timeLeft.border}`}>
                        {timeLeft.icon}
                        <span className={`text-xs font-medium ml-2 ${timeLeft.color}`}>
                            {timeLeft.text}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(project)}
                            className="p-2 text-gray-600 hover:text-[#005954] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onStatusChange(project)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Change Status"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(project)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {project.note && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-1">Note</div>
                        <p className="text-sm text-gray-600 line-clamp-2">{project.note}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Status Modal */}
            {selectedProject && (
                <StatusModal
                    show={showStatusModal}
                    onClose={() => {
                        setShowStatusModal(false);
                        setSelectedProject(null);
                    }}
                    project={selectedProject}
                    statusOptions={statusOptions || []}
                />
            )}

            {/* Mobile View */}
            <div className="block lg:hidden">
                <div className="p-4">
                    {projects.data.map((project, index) => (
                        <MobileProjectCard key={project.id} project={project} index={index} />
                    ))}
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Project Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Timeline
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.data.map((project, index) => {
                            const timeLeft = calculateTimeLeft(project.deadline);
                            const duration = calculateDaysDuration(project.start_date, project.deadline);
                            const rowNumber = (projects.current_page - 1) * projects.per_page + index + 1;

                            return (
                                <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                                                <span className="text-sm font-semibold text-gray-700">{rowNumber}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex items-start">
                                            <FileText className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {project.project_description}
                                                </div>
                                                <div className="flex items-center gap-3 mt-2">
                                                    {/* PERBAIKAN: Tampilkan company */}
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Building className="w-4 h-4 mr-1" />
                                                        <span className="truncate">{getCompanyName(project.company_id)}</span>
                                                    </div>
                                                    {project.quotation && (
                                                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                            {project.quotation.quotation_number}
                                                        </div>
                                                    )}
                                                </div>
                                                {project.note && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-500 line-clamp-1" title={project.note}>
                                                            📝 {project.note}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">Start</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatDate(project.start_date)}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-500">Deadline</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatDate(project.deadline)}
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${timeLeft.bg} ${timeLeft.border}`}>
                                                    {timeLeft.icon}
                                                    <span className={`text-xs font-medium ml-2 ${timeLeft.color}`}>
                                                        {timeLeft.text}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleStatusClick(project)}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            title="Click to change status"
                                        >
                                            {getStatusBadgeWithoutClick(project)}
                                        </button>
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => onEdit(project)}
                                                className="p-2 text-gray-600 hover:text-[#005954] hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onStatusChange(project)}
                                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Change Status"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(project)}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Delete"
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

            {/* Pagination */}
            {projects.data.length > 0 && projects.last_page > 1 && (
                <div className="bg-white px-6 py-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{projects.from}</span> to{' '}
                            <span className="font-medium">{projects.to}</span> of{' '}
                            <span className="font-medium">{projects.total}</span> projects
                        </div>
                        <div className="flex items-center space-x-1">
                            {projects.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`min-w-[40px] h-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                        link.active
                                            ? 'bg-[#005954] text-white'
                                            : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectTable;