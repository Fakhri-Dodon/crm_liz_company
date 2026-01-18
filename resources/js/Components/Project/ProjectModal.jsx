import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Calendar, FileText, Clock, MessageSquare, ChevronDown, Users, Loader2 } from 'lucide-react';
import axios from 'axios';

const ProjectModal = ({ 
    show, 
    onClose, 
    projectId,
    companies: initialCompanies,
    quotations, 
    statusOptions, 
    isEdit = false,
    title = "Add Project",
    onSuccess
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [projectData, setProjectData] = useState(null);
    const [loadingClients, setLoadingClients] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Gunakan useForm dengan initial state kosong
    const { data, setData, post, put, processing, errors, reset } = useForm({
        quotation_id: '',
        company_id: '',
        project_description: '',
        start_date: '',
        deadline: '',
        note: '',
        status: 'in_progress'
    });

    // Initialize clients dari prop atau fetch dari API
    useEffect(() => {
        if (show) {
            if (initialCompanies && initialCompanies.length > 0) {
                const transformedClients = initialCompanies.map(company => ({
                    id: company.id,
                    name: company.name || company.full_display || company.display_name,
                    display_name: company.display_name || company.name,
                    full_display: company.full_display || company.display_name || company.name,
                    client_code: company.client_code,
                    city: company.city,
                    has_lead: company.has_lead
                }));
                setClients(transformedClients);
            } else {
                fetchClients();
            }
        }
    }, [show, initialCompanies]);

    // Fetch project data saat modal edit dibuka
    useEffect(() => {
        if (show && isEdit && projectId) {
            console.log('Fetching project data for edit mode');
            fetchProjectData();
        }
    }, [show, isEdit, projectId]);

    // RESET FORM KETIKA MODAL CREATE DIBUKA
    useEffect(() => {
        if (show && !isEdit) {
            console.log('Resetting form for create mode');
            resetForm();
        }
    }, [show, isEdit]);

    // RESET FORM KETIKA MODAL TERTUTUP
    useEffect(() => {
        if (!show) {
            console.log('Modal closed, resetting form');
            resetForm();
        }
    }, [show]);

    const fetchClients = async () => {
        setLoadingClients(true);
        try {
            const response = await axios.get('/api/clients');
            if (response.data.success) {
                setClients(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const fetchProjectData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/projects/${projectId}/edit`);
            const project = response.data;
            
            setProjectData(project);
            
            const formData = {
                quotation_id: project.quotation_id || '',
                company_id: project.company_id || '',
                project_description: project.project_description || '',
                start_date: project.start_date || '',
                deadline: project.deadline || '',
                note: project.note || '',
                status: project.status || 'in_progress'
            };
            
            setData(formData);
            
        } catch (error) {
            console.error('Error fetching project data:', error);
            if (error.response?.status === 404) {
                alert('Project not found. It may have been deleted.');
                handleCloseModal();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        console.log('Resetting form to empty state');
        reset({
            quotation_id: '',
            company_id: '',
            project_description: '',
            start_date: '',
            deadline: '',
            note: '',
            status: 'in_progress'
        });
        setProjectData(null);
        setIsSubmitting(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // TUTUP MODAL LANGSUNG SETELAH SUBMIT DITEKAN
        // Panggil onSuccess untuk menutup modal segera
        if (onSuccess && typeof onSuccess === 'function') {
            console.log('Calling onSuccess to close modal immediately');
            onSuccess();
        }
        
        // Set submitting state untuk UI feedback
        setIsSubmitting(true);
        
        // Kirim data ke server
        if (isEdit && projectId) {
            put(route('projects.update', projectId), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    console.log('Project updated successfully on server');
                    // Reset form setelah sukses
                    resetForm();
                    // Tidak perlu panggil onSuccess lagi karena sudah dipanggil di atas
                },
                onError: (errors) => {
                    console.error('Update errors:', errors);
                    setIsSubmitting(false);
                    // Jika error, modal tetap tertutup (karena sudah ditutup di awal)
                    // Bisa tambahkan logika untuk membuka modal kembali jika perlu
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } else {
            const submitData = {
                ...data,
                status: 'in_progress'
            };
            
            post(route('projects.store'), submitData, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    console.log('Project created successfully on server');
                    // Reset form setelah sukses
                    resetForm();
                    // Tidak perlu panggil onSuccess lagi karena sudah dipanggil di atas
                },
                onError: (errors) => {
                    console.error('Store errors:', errors);
                    setIsSubmitting(false);
                    // Jika error, modal tetap tertutup (karena sudah ditutup di awal)
                    // Bisa tambahkan logika untuk membuka modal kembali jika perlu
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        }
    };

    // Fungsi untuk menutup modal dengan aman
    const handleCloseModal = () => {
        if (!processing && !isLoading && !isSubmitting) {
            console.log('Manual close modal, resetting form');
            resetForm();
            // Panggil onClose yang diberikan dari parent
            if (onClose && typeof onClose === 'function') {
                onClose();
            }
        }
    };

    // Handle ESC key press
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && show) {
                handleCloseModal();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [show, processing, isLoading, isSubmitting]);

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
                            onClick={handleCloseModal}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processing || isLoading || isSubmitting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Loading State */}
                    {isLoading && isEdit ? (
                        <div className="p-12 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-[#005954] animate-spin mb-4" />
                            <p className="text-gray-600">Loading project data...</p>
                        </div>
                    ) : (
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
                                        maxLength={250}
                                        required
                                        placeholder="Describe the project scope and objectives..."
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        {errors.project_description ? (
                                            <p className="text-sm text-red-600">{errors.project_description}</p>
                                        ) : (
                                            <div className="text-xs text-gray-400">
                                                Brief and descriptive (max 250 characters)
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            {data.project_description?.length || 0}/250
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client and Quotation Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Client Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Client *
                                    </label>
                                    <div className="relative">
                                        {loadingClients && clients.length === 0 ? (
                                            <div className="flex items-center justify-center py-3 border border-gray-300 rounded-xl">
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-500 mr-2" />
                                                <span className="text-sm text-gray-500">Loading clients...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <select
                                                    value={data.company_id}
                                                    onChange={e => setData('company_id', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent appearance-none transition-colors ${
                                                        errors.company_id ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    required
                                                    disabled={loadingClients || isSubmitting}
                                                >
                                                    <option value="" className="text-gray-400">Select a client</option>
                                                    {clients.map(client => (
                                                        <option key={client.id} value={client.id}>
                                                            {client.full_display || client.display_name || client.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {errors.company_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>
                                    )}
                                </div>

                                {/* Quotation Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Quotation *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.quotation_id}
                                            onChange={e => setData('quotation_id', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent appearance-none transition-colors"
                                            required
                                            disabled={isSubmitting}
                                        >
                                            <option value="" className="text-gray-400">Select a quotation</option>
                                            {quotations && quotations.map(quote => (
                                                <option key={quote.id} value={quote.id}>
                                                    {quote.display_name || quote.name || quote.number}
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
                                        disabled={isSubmitting}
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
                                        disabled={isSubmitting}
                                    />
                                    {errors.deadline && (
                                        <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                                    )}
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
                                    maxLength={250}
                                    placeholder="Additional notes or requirements..."
                                    disabled={isSubmitting}
                                />
                                <div className="text-right text-xs text-gray-500 mt-2">
                                    {data.note?.length || 0}/250 characters
                                </div>
                            </div>

                            {/* Status - Hanya untuk edit mode */}
                            {isEdit && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project Status
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {statusOptions?.filter(option => 
                                            ['in_progress', 'completed', 'pending', 'cancelled'].includes(option.value)
                                        ).map(option => {
                                            const colors = {
                                                in_progress: 'bg-blue-50 text-blue-700 border-blue-500',
                                                completed: 'bg-green-50 text-green-700 border-green-500',
                                                pending: 'bg-yellow-50 text-yellow-700 border-yellow-500',
                                                cancelled: 'bg-red-50 text-red-700 border-red-500'
                                            };
                                            const colorClass = colors[option.value] || 'bg-gray-50 text-gray-700 border-gray-500';
                                            
                                            return (
                                                <button
                                                    type="button"
                                                    key={option.value}
                                                    onClick={() => setData('status', option.value)}
                                                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                                                        data.status === option.value 
                                                            ? `${colorClass} ring-2 ring-offset-1 ring-[#005954]` 
                                                            : `${colorClass} hover:opacity-90`
                                                    }`}
                                                    disabled={isSubmitting}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.status && (
                                        <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                    )}
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoading || isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#005954] text-white rounded-xl hover:bg-[#004d47] transition-colors font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                    disabled={isLoading || isSubmitting || (clients.length === 0 && loadingClients)}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        isEdit ? 'Update Project' : 'Create Project'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;