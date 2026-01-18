import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Calendar, FileText, Clock, MessageSquare, ChevronDown, Users, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const ProjectModal = ({ 
    show, 
    onClose, 
    projectId,
    companies: initialCompanies,
    quotations, 
    statusOptions, 
    isEdit = false,
    title,
    onSuccess
}) => {
    const { t } = useTranslation();
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
            showToast(t('project_modal.error_fetching_clients'), 'error');
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
                showToast(t('project_modal.project_not_found'), 'error');
                handleCloseModal();
            } else {
                showToast(t('project_modal.error_fetching_project'), 'error');
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

    const showToast = (message, type = 'success') => {
        const existingToasts = document.querySelectorAll('[data-toast]');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.setAttribute('data-toast', 'true');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4">
                    ✕
                </button>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validasi form
        if (!data.project_description?.trim()) {
            showToast(t('project_modal.project_description_required'), 'error');
            return;
        }
        
        if (!data.company_id) {
            showToast(t('project_modal.client_required'), 'error');
            return;
        }
        
        if (!data.quotation_id) {
            showToast(t('project_modal.quotation_required'), 'error');
            return;
        }
        
        if (!data.start_date) {
            showToast(t('project_modal.start_date_required'), 'error');
            return;
        }
        
        if (!data.deadline) {
            showToast(t('project_modal.deadline_required'), 'error');
            return;
        }
        
        // Validasi tanggal
        if (data.start_date && data.deadline) {
            const startDate = new Date(data.start_date);
            const deadlineDate = new Date(data.deadline);
            
            if (deadlineDate < startDate) {
                showToast(t('project_modal.deadline_before_start'), 'error');
                return;
            }
        }

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
                    showToast(t('project_modal.project_updated'), 'success');
                    // Reset form setelah sukses
                    resetForm();
                },
                onError: (errors) => {
                    console.error('Update errors:', errors);
                    setIsSubmitting(false);
                    showToast(t('project_modal.update_error'), 'error');
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
                    showToast(t('project_modal.project_created'), 'success');
                    // Reset form setelah sukses
                    resetForm();
                },
                onError: (errors) => {
                    console.error('Store errors:', errors);
                    setIsSubmitting(false);
                    showToast(t('project_modal.save_error'), 'error');
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

    // Determine title and description based on mode
    const modalTitle = title || (isEdit ? t('project_modal.edit_project_title') : t('project_modal.add_project_title'));
    const modalDescription = isEdit ? t('project_modal.edit_project_description') : t('project_modal.add_project_description');

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
                                    {modalTitle}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {modalDescription}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCloseModal}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={processing || isLoading || isSubmitting}
                            title={t('project_modal.close_modal')}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Loading State */}
                    {isLoading && isEdit ? (
                        <div className="p-12 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-[#005954] animate-spin mb-4" />
                            <p className="text-gray-600">{t('project_modal.loading_project')}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Project Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {t('project_modal.project_description')} *
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
                                        placeholder={t('project_modal.project_description_placeholder')}
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        {errors.project_description ? (
                                            <p className="text-sm text-red-600">{errors.project_description}</p>
                                        ) : (
                                            <div className="text-xs text-gray-400">
                                                {t('project_modal.project_description_hint')}
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
                                        {t('project_modal.client')} *
                                    </label>
                                    <div className="relative">
                                        {loadingClients && clients.length === 0 ? (
                                            <div className="flex items-center justify-center py-3 border border-gray-300 rounded-xl">
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-500 mr-2" />
                                                <span className="text-sm text-gray-500">
                                                    {t('project_modal.loading_clients')}
                                                </span>
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
                                                    <option value="" className="text-gray-400">
                                                        {t('project_modal.client_placeholder')}
                                                    </option>
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
                                        {t('project_modal.quotation')} *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.quotation_id}
                                            onChange={e => setData('quotation_id', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent appearance-none transition-colors ${
                                                errors.quotation_id ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            required
                                            disabled={isSubmitting}
                                        >
                                            <option value="" className="text-gray-400">
                                                {t('project_modal.quotation_placeholder')}
                                            </option>
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
                                    {errors.quotation_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.quotation_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Dates Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Start Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {t('project_modal.start_date')} *
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
                                        {t('project_modal.deadline')} *
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
                                    {t('project_modal.note')}
                                </label>
                                <textarea
                                    value={data.note}
                                    onChange={e => setData('note', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent min-h-[100px] resize-none transition-colors"
                                    maxLength={250}
                                    placeholder={t('project_modal.note_placeholder')}
                                    disabled={isSubmitting}
                                />
                                <div className="text-right text-xs text-gray-500 mt-2">
                                    {t('project_modal.note_character_count', { current: data.note?.length || 0 })}
                                </div>
                            </div>

                            {/* Status - Hanya untuk edit mode */}
                            {isEdit && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('project_modal.status')}
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
                                    {t('project_modal.cancel_button')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#005954] text-white rounded-xl hover:bg-[#004d47] transition-colors font-medium flex-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                                    disabled={isLoading || isSubmitting || (clients.length === 0 && loadingClients)}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('project_modal.processing')}
                                        </>
                                    ) : (
                                        isEdit ? t('project_modal.update_project_button') : t('project_modal.create_project_button')
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