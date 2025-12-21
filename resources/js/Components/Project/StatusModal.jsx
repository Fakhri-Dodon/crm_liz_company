import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';

export default function StatusModal({ show, onClose, project, statusOptions }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        status: project?.status || ''
    });

    useEffect(() => {
        if (project) {
            setData('status', project.status);
        }
    }, [project]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!project) return;

        put(route('projects.status.update', project.id), {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                reset();
            },
            onError: () => {
                console.error('Failed to update status:', errors);
            }
        });
    };

    if (!show) return null;

    const statusColors = {
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Update Project Status
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {project && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-1">
                                    {project.project_description}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                                        Current: {statusOptions?.find(opt => opt.value === project.status)?.label || project.status}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        • Client: {project.client?.name || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent text-sm"
                                        required
                                        disabled={processing}
                                    >
                                        <option value="">Select Status</option>
                                        {statusOptions?.map(option => (
                                            <option 
                                                key={option.value} 
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.status && (
                                        <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={processing || !data.status}
                                >
                                    {processing ? 'Updating...' : 'Update Status'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}