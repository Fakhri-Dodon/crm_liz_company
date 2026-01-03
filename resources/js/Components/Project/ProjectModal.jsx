import React, { useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { X, Calendar, User, FileText, Clock, MessageSquare, ChevronDown } from 'lucide-react';

const ProjectModal = ({ 
    show, 
    onClose, 
    project, 
    companies,
    quotations, 
    statusOptions, 
    isEdit = false,
    title = "Add Project"
}) => {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        quotation_id: project?.quotation_id || '',
        company_id: project?.company_id || '',
        project_description: project?.project_description || '',
        start_date: project?.start_date || '',
        deadline: project?.deadline || '',
        note: project?.note || '',
        status: project?.status || 'in_progress' // Default ke In Progress
    });

    useEffect(() => {
        if (project && isEdit) {
            setData({
                quotation_id: project.quotation_id || '',
                company_id: project.company_id || '',
                project_description: project.project_description,
                start_date: project.start_date,
                deadline: project.deadline,
                note: project.note || '',
                status: project.status
            });
        }
    }, [project, isEdit]);

    // Filter hanya 4 status yang diinginkan
    const filteredStatusOptions = statusOptions?.filter(option => 
        ['in_progress', 'completed', 'pending', 'cancelled'].includes(option.value)
    ) || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEdit) {
            put(route('projects.update', project.id), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    reset();
                    onClose();
                    router.reload({ 
                        only: ['projects', 'summary', 'filters'],
                        preserveScroll: true 
                    });
                }
            });
        } else {
            post(route('projects.store'), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    reset();
                    onClose();
                    router.reload({ 
                        only: ['projects', 'summary', 'filters'],
                        preserveScroll: true 
                    });
                }
            });
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#005954]/10 rounded-lg">
                                <FileText className="w-6 h-6 text-[#005954]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {isEdit ? 'Update project details' : 'Create a new project'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Project Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Project Description *
                            </label>
                            <div className="relative">
                                <textarea
                                    value={data.project_description}
                                    onChange={e => setData('project_description', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent min-h-[100px] resize-none transition-colors ${
                                        errors.project_description ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    maxLength={500}
                                    required
                                    placeholder="Describe the project scope and objectives..."
                                />
                                <div className="flex justify-between items-center mt-2">
                                    {errors.project_description ? (
                                        <p className="text-sm text-red-600">{errors.project_description}</p>
                                    ) : (
                                        <div className="text-xs text-gray-400">
                                            Brief and descriptive
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        {data.project_description?.length || 0}/500
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company and Quotation Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Company Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Company *
                                </label>
                                <div className="relative">
                                    <select
                                        value={data.company_id}
                                        onChange={e => setData('company_id', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent appearance-none transition-colors ${
                                            errors.company_id ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                    >
                                        <option value="" className="text-gray-400">Select a company</option>
                                        {companies && companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                {errors.company_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>
                                )}
                            </div>

                            {/* Quotation Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Quotation (Optional)
                                </label>
                                <div className="relative">
                                    <select
                                        value={data.quotation_id}
                                        onChange={e => setData('quotation_id', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent appearance-none transition-colors"
                                    >
                                        <option value="" className="text-gray-400">Select a quotation</option>
                                        {quotations && quotations.map(quote => (
                                            <option key={quote.id} value={quote.id}>
                                                {quote.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dates Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={e => setData('start_date', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent transition-colors ${
                                        errors.start_date ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.start_date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                                )}
                            </div>

                            {/* Deadline */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Deadline *
                                </label>
                                <input
                                    type="date"
                                    value={data.deadline}
                                    onChange={e => setData('deadline', e.target.value)}
                                    min={data.start_date}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent transition-colors ${
                                        errors.deadline ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {errors.deadline && (
                                    <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                                )}
                            </div>
                        </div>

                        {/* Status and Note Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredStatusOptions.map(option => {
                                        // Colors untuk 4 status saja
                                        const colors = {
                                            in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
                                            completed: 'bg-green-50 text-green-700 border-green-200',
                                            pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                            cancelled: 'bg-red-50 text-red-700 border-red-200'
                                        };
                                        const colorClass = colors[option.value] || 'bg-gray-50 text-gray-700 border-gray-200';
                                        
                                        return (
                                            <button
                                                type="button"
                                                key={option.value}
                                                onClick={() => setData('status', option.value)}
                                                className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                                                    data.status === option.value 
                                                        ? `${colorClass} ring-2 ring-offset-1 ring-[#005954]` 
                                                        : `${colorClass} hover:opacity-90`
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Note (Optional)
                                </label>
                                <textarea
                                    value={data.note}
                                    onChange={e => setData('note', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent min-h-[100px] resize-none transition-colors"
                                    maxLength={500}
                                    placeholder="Additional notes or requirements..."
                                />
                                <div className="text-right text-xs text-gray-500 mt-2">
                                    {data.note?.length || 0}/500 characters
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1"
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-[#005954] text-white rounded-xl hover:bg-[#004d47] transition-colors font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                disabled={processing}
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </span>
                                ) : (
                                    isEdit ? 'Update Project' : 'Create Project'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;