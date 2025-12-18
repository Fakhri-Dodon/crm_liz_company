import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';

const StatusModal = ({ show, onClose, project, statusOptions }) => {
    const [selectedStatus, setSelectedStatus] = useState(project?.status || 'in_progress');
    const { patch, processing } = useForm();

    if (!show || !project) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('projects.status.update', project.id, { status: selectedStatus }), {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            in_progress: 'text-blue-600 bg-blue-100',
            completed: 'text-green-600 bg-green-100',
            pending: 'text-yellow-600 bg-yellow-100',
            cancelled: 'text-red-600 bg-red-100'
        };
        return colors[status] || 'text-gray-600 bg-gray-100';
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                        Change Project Status
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-600 mb-2">
                        Project: <span className="font-semibold">{project.project_description}</span>
                    </p>
                    <p className="text-gray-600">
                        Current Status: 
                        <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${getStatusColor(project.status)}`}>
                            {project.status_text || project.status}
                        </span>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select New Status
                        </label>
                        <div className="space-y-2">
                            {statusOptions.map(option => (
                                <div key={option.value} className="flex items-center">
                                    <input
                                        type="radio"
                                        id={`status-${option.value}`}
                                        name="status"
                                        value={option.value}
                                        checked={selectedStatus === option.value}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <label 
                                        htmlFor={`status-${option.value}`}
                                        className="ml-3 block text-sm font-medium text-gray-700"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={processing}
                        >
                            {processing ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StatusModal;