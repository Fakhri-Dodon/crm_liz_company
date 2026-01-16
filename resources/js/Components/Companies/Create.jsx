// resources/js/Components/Companies/Create.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check, ChevronDown, Search, AlertTriangle } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Create = ({ isOpen, onClose, clientTypes, quotationId, onSuccess }) => {
    const { flash } = usePage().props;
    const { t } = useTranslation();
    
    // State untuk menyimpan data form
    const [formData, setFormData] = useState({
        company_name: '',
        client_type_id: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        contact_position: '',
        city: '',
        province: '',
        country: '',
        postal_code: '',
        vat_number: '', // TIDAK WAJIB
        nib: '', // TIDAK WAJIB
        website: '', // TIDAK WAJIB
        logo: null,
        status: 'active',
        quotation_id: quotationId || '',
        lead_id: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    
    // State untuk quotations
    const [quotations, setQuotations] = useState([]);
    const [loadingQuotations, setLoadingQuotations] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [quotationSearch, setQuotationSearch] = useState('');
    
    // State untuk lead dari quotation yang dipilih
    const [quotationLead, setQuotationLead] = useState(null);
    const [loadingLead, setLoadingLead] = useState(false);
    
    // State untuk error quotation yang sudah digunakan
    const [quotationUsedError, setQuotationUsedError] = useState(null);

    // Fungsi untuk mendapatkan CSRF token dari Laravel
    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        console.log('CSRF Token found:', token ? 'Yes' : 'No');
        return token;
    };

    // Setup axios defaults dengan CSRF token yang benar
    useEffect(() => {
        const csrfToken = getCsrfToken();
        
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.withCredentials = true;
        
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
            console.log('CSRF Token set for axios');
        } else {
            console.warn('CSRF Token not found!');
        }
        
        // Juga tambahkan Accept header untuk JSON
        axios.defaults.headers.common['Accept'] = 'application/json';
    }, []);

    // Reset form ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            console.log('Modal opened...');
            
            // Reset form data
            setFormData({
                company_name: '',
                client_type_id: '',
                contact_person: '',
                contact_email: '',
                contact_phone: '',
                contact_position: '',
                city: '',
                province: '',
                country: '',
                postal_code: '',
                vat_number: '', // TIDAK WAJIB
                nib: '', // TIDAK WAJIB
                website: '', // TIDAK WAJIB
                logo: null,
                status: 'active',
                quotation_id: quotationId || '',
                lead_id: ''
            });
            
            setSelectedQuotation(null);
            setQuotationLead(null);
            setQuotationSearch('');
            setLogoPreview(null);
            setErrors({});
            setQuotationUsedError(null);
            
            // Fetch quotations jika tidak ada quotationId
            if (!quotationId) {
                fetchAcceptedQuotations();
            } else {
                fetchLeadFromQuotation(quotationId);
            }
        }
    }, [isOpen, quotationId]);

    // Fetch quotations dengan status accepted
    const fetchAcceptedQuotations = async () => {
        setLoadingQuotations(true);
        try {
            const csrfToken = getCsrfToken();
            const response = await axios.get('/companies/get-accepted-quotations', {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                }
            });
            
            if (response && response.data && response.data.success) {
                // Data dari backend sudah difilter yang belum digunakan
                setQuotations(response.data.data || []);
                
                // Jika tidak ada quotations yang tersedia
                if (response.data.data && response.data.data.length === 0) {
                    setQuotationUsedError({
                        type: 'info',
                        message: t('companies_create.no_available_quotations')
                    });
                }
            } else {
                setQuotations([]);
            }
        } catch (error) {
            console.error('Error fetching quotations:', error);
            setQuotations([]);
        } finally {
            setLoadingQuotations(false);
        }
    };

    // Handle quotation selection
    const handleQuotationSelect = async (quotation) => {
        // Reset error sebelumnya
        setQuotationUsedError(null);
        setSelectedQuotation(quotation);
        setQuotationLead(null);
        
        // Set quotation_id di form
        setFormData(prev => ({
            ...prev,
            quotation_id: quotation.id,
            lead_id: quotation.lead?.id || '',
            company_name: quotation.lead?.company_name || prev.company_name,
            contact_person: quotation.lead?.contact_person || prev.contact_person,
            contact_email: quotation.lead?.email || prev.contact_email,
            contact_phone: quotation.lead?.phone || prev.contact_phone,
            contact_position: quotation.lead?.position || t('companies_create.contact_person'),
            vat_number: quotation.lead?.vat_number || '', // TIDAK WAJIB
            nib: quotation.lead?.nib || '', // TIDAK WAJIB
            website: quotation.lead?.website || '' // TIDAK WAJIB
        }));
        
        // Set lead data
        if (quotation.lead) {
            setQuotationLead(quotation.lead);
        }
    };

    // Fetch lead data dari quotation
    const fetchLeadFromQuotation = async (quotationId) => {
        if (!quotationId) return;
        
        setLoadingLead(true);
        setQuotationUsedError(null);
        try {
            const csrfToken = getCsrfToken();
            const response = await axios.get(`/companies/get-lead-from-quotation/${quotationId}`, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                }
            });
            
            if (response && response.data) {
                if (response.data.success) {
                    const leadData = response.data.data;
                    setQuotationLead(leadData);
                    
                    // Auto-fill form dengan data lead
                    setFormData(prev => ({
                        ...prev,
                        quotation_id: quotationId,
                        lead_id: leadData.id || '',
                        company_name: leadData.company_name || prev.company_name,
                        contact_person: leadData.contact_person || prev.contact_person,
                        contact_email: leadData.email || prev.contact_email,
                        contact_phone: leadData.phone || prev.contact_phone,
                        contact_position: leadData.position || t('companies_create.contact_person'),
                        city: leadData.city || prev.city,
                        province: leadData.province || prev.province,
                        country: leadData.country || prev.country,
                        postal_code: leadData.postal_code || prev.postal_code,
                        vat_number: leadData.vat_number || '', // TIDAK WAJIB
                        nib: leadData.nib || '', // TIDAK WAJIB
                        website: leadData.website || '' // TIDAK WAJIB
                    }));
                } else {
                    // Error dari server (misal: quotation sudah digunakan)
                    if (response.data.message && (
                        response.data.message.includes('sudah digunakan') || 
                        response.data.message.includes('already used')
                    )) {
                        setQuotationUsedError({
                            type: 'error',
                            message: response.data.message,
                            company_name: response.data.company_name,
                            company_id: response.data.company_id
                        });
                        
                        // Reset form
                        setFormData(prev => ({
                            ...prev,
                            quotation_id: '',
                            lead_id: ''
                        }));
                    } else {
                        alert(response.data.message || t('companies_create.error_fetching_lead'));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching lead:', error);
            
            // Handle specific error untuk quotation yang sudah digunakan
            if (error.response?.status === 400 && error.response?.data?.message) {
                if (error.response.data.message.includes('sudah digunakan') || 
                    error.response.data.message.includes('already used')) {
                    setQuotationUsedError({
                        type: 'error',
                        message: error.response.data.message,
                        company_name: error.response.data.company_name,
                        company_id: error.response.data.company_id
                    });
                    
                    // Reset form
                    setFormData(prev => ({
                        ...prev,
                        quotation_id: '',
                        lead_id: ''
                    }));
                }
            } else {
                alert(t('companies_create.error_fetching_lead'));
            }
        } finally {
            setLoadingLead(false);
        }
    };

    // Clear quotation selection
    const clearQuotationSelection = () => {
        setSelectedQuotation(null);
        setQuotationLead(null);
        setQuotationUsedError(null);
        setFormData(prev => ({
            ...prev,
            quotation_id: '',
            lead_id: '',
            company_name: '',
            contact_person: '',
            contact_email: '',
            contact_phone: '',
            vat_number: '', // TIDAK WAJIB
            nib: '', // TIDAK WAJIB
            website: '', // TIDAK WAJIB
            city: '',
            province: '',
            country: '',
            postal_code: ''
        }));
        setQuotationSearch('');
    };

    // Filter quotations berdasarkan search
    const filteredQuotations = quotations.filter(quotation => {
        if (!quotationSearch) return true;
        
        const searchLower = quotationSearch.toLowerCase();
        return (
            quotation.quotation_number?.toLowerCase().includes(searchLower) ||
            quotation.subject?.toLowerCase().includes(searchLower) ||
            (quotation.lead?.company_name?.toLowerCase().includes(searchLower)) ||
            (quotation.lead?.contact_person?.toLowerCase().includes(searchLower))
        );
    });

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            setFormData(prev => ({ ...prev, [name]: file }));
            
            // Create preview
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setLogoPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setLogoPreview(null);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle submit dengan CSRF token yang benar
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data before submit:', formData);

        // Validasi field wajib
        const requiredFields = [
            'company_name',
            'client_type_id',
            'contact_person',
            'contact_email',
            'contact_phone',
            'status'
        ];

        let hasError = false;
        const newErrors = {};

        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = t('companies_create.field_required', { field: field.replace('_', ' ') });
                hasError = true;
            }
        });

        if (hasError) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        // Buat FormData untuk upload file
        const formDataToSend = new FormData();
        
        // **TAMBAHKAN CSRF TOKEN KE FORMDATA SECARA MANUAL**
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            formDataToSend.append('_token', csrfToken);
        }
        
        // Append semua data ke FormData
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                if (key === 'logo' && value instanceof File) {
                    formDataToSend.append('logo', value);
                } else {
                    formDataToSend.append(key, value.toString());
                }
            }
        });

        // Tambahkan name field dari contact_person
        if (formData.contact_person) {
            formDataToSend.append('name', formData.contact_person);
        }

        // Pastikan ada quotation_id jika dari prop
        if (quotationId && !formData.quotation_id) {
            formDataToSend.append('quotation_id', quotationId);
        }

        try {
            console.log('Sending form data...');
            console.log('CSRF Token to send:', csrfToken);
            
            // **GUNAKAN AXIOS DENGAN KONFIGURASI SEDERHANA**
            const response = await axios.post('/companies', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            console.log('Server response:', response);

            if (response && response.data && response.data.success) {
                // Success message
                alert(response.data.message || t('companies_create.client_created_successfully'));
                
                // Tutup modal
                onClose();
                
                // Reset form
                setFormData({
                    company_name: '',
                    client_type_id: '',
                    contact_person: '',
                    contact_email: '',
                    contact_phone: '',
                    contact_position: '',
                    city: '',
                    province: '',
                    country: '',
                    postal_code: '',
                    vat_number: '',
                    nib: '',
                    website: '',
                    logo: null,
                    status: 'active',
                    quotation_id: '',
                    lead_id: ''
                });
                setSelectedQuotation(null);
                setQuotationLead(null);
                setQuotationUsedError(null);
                setLogoPreview(null);
                
                // Panggil callback success jika ada
                if (onSuccess) {
                    onSuccess();
                }
                
                // Refresh data
                router.reload({
                    only: ['companies', 'statistics'],
                    preserveScroll: true,
                });
            } else {
                setErrors(response?.data?.errors || {});
                alert(response?.data?.message || t('companies_create.failed_to_create_client'));
            }

        } catch (error) {
            console.error('Error creating client:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 419) {
                // CSRF token error - refresh token
                const newToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                console.log('Current CSRF token:', newToken);
                
                alert('CSRF token expired. Please refresh the page and try again.');
                window.location.reload();
            } else if (error.response?.status === 422) {
                // Validation errors
                setErrors(error.response.data.errors || {});
                
                const errorMessages = Object.values(error.response.data.errors || {})
                    .flat()
                    .join('\n');
                
                if (errorMessages) {
                    alert(t('companies_create.validation_errors') + '\n' + errorMessages);
                }
            } else if (error.response?.status === 400 && error.response?.data?.message) {
                // Handle quotation already used error
                if (error.response.data.message.includes('already used') || 
                    error.response.data.message.includes('sudah digunakan')) {
                    setQuotationUsedError({
                        type: 'error',
                        message: error.response.data.message,
                        company_name: error.response.data.company_name,
                        company_id: error.response.data.company_id
                    });
                    
                    alert(t('companies_create.quotation_already_used'));
                } else {
                    alert(error.response.data.message || t('companies_create.error_creating_client'));
                }
            } else {
                alert(`${t('companies_create.error_creating_client')}: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('companies_create.title')}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {t('companies_create.subtitle')}
                        </p>
                        {quotationId && (
                            <div className="mt-1 text-sm text-blue-600">
                                {t('companies_create.creating_from_quotation')}: <strong>{quotationId}</strong>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="p-6 space-y-6">
                        {/* Quotation Selection */}
                        {!quotationId && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    {t('companies_create.select_from_quotation')}
                                </h3>
                                
                                {/* Error message untuk quotation yang sudah digunakan */}
                                {quotationUsedError && (
                                    <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                                        quotationUsedError.type === 'error' 
                                            ? 'bg-red-100 border border-red-300 text-red-800'
                                            : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
                                    }`}>
                                        {quotationUsedError.type === 'error' ? (
                                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium">{quotationUsedError.message}</p>
                                            {quotationUsedError.company_name && (
                                                <p className="text-sm mt-1">
                                                    {t('companies_create.already_has_company')}: 
                                                    <strong className="ml-1">{quotationUsedError.company_name}</strong>
                                                    {quotationUsedError.company_id && (
                                                        <span className="ml-2 text-xs">(ID: {quotationUsedError.company_id})</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {loadingQuotations ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            {t('companies_create.loading_quotations')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedQuotation ? (
                                            <div className="bg-white border border-green-300 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-green-700">
                                                                {selectedQuotation.quotation_number}
                                                            </span>
                                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                                                {t('companies_create.accepted')}
                                                            </span>
                                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                                {t('companies_create.unused')}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            {selectedQuotation.subject}
                                                        </div>
                                                        {selectedQuotation.lead && (
                                                            <div className="mt-2 text-sm">
                                                                <div className="font-medium text-gray-700">
                                                                    {selectedQuotation.lead.company_name}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={clearQuotationSelection}
                                                        className="text-gray-400 hover:text-gray-600 p-1"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder={t('companies_create.search_quotations')}
                                                        value={quotationSearch}
                                                        onChange={(e) => setQuotationSearch(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                                    {filteredQuotations.length > 0 ? (
                                                        filteredQuotations.map(quotation => (
                                                            <div
                                                                key={quotation.id}
                                                                onClick={() => handleQuotationSelect(quotation)}
                                                                className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition last:border-b-0"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-medium text-gray-900">
                                                                                {quotation.quotation_number}
                                                                            </span>
                                                                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                                                                {t('companies_create.accepted')}
                                                                            </span>
                                                                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                                                                {t('companies_create.unused')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 mb-1">
                                                                            {quotation.subject}
                                                                        </div>
                                                                        {quotation.lead && (
                                                                            <div className="text-xs text-gray-500">
                                                                                {quotation.lead.company_name} • {quotation.lead.contact_person}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                                                                <FileText className="w-6 h-6 text-gray-400" />
                                                            </div>
                                                            <p className="text-sm text-gray-600 font-medium">
                                                                {quotationSearch
                                                                    ? t('companies_create.no_quotations_found_search')
                                                                    : t('companies_create.no_available_quotations')
                                                                }
                                                            </p>
                                                            {!quotationSearch && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {t('companies_create.all_quotations_used')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Info tentang quotations yang sudah digunakan */}
                                                <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                            <span>{t('companies_create.available_quotations')}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                            <span>{t('companies_create.used_quotations_hidden')}</span>
                                                        </div>
                                                    </div>
                                                    <p className="mt-1">
                                                        {t('companies_create.only_unused_quotations_shown')}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Error jika quotation dari prop sudah digunakan */}
                        {quotationId && quotationUsedError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-red-800">
                                            {t('companies_create.quotation_unavailable')}
                                        </h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            {quotationUsedError.message}
                                        </p>
                                        {quotationUsedError.company_name && (
                                            <div className="mt-2 p-2 bg-red-100 rounded">
                                                <p className="text-sm font-medium">
                                                    {t('companies_create.quotation_already_used_by')}
                                                </p>
                                                <p className="text-sm">
                                                    {quotationUsedError.company_name}
                                                    {quotationUsedError.company_id && (
                                                        <span className="ml-2 text-xs">(ID: {quotationUsedError.company_id})</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Company Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                {t('companies_create.company_information')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name - Wajib */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.company_name')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.company_name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.company_name_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.company_name && (
                                        <p className="text-xs text-red-600 mt-1">{errors.company_name}</p>
                                    )}
                                </div>

                                {/* Client Type - Wajib */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.client_type')} <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        name="client_type_id"
                                        value={formData.client_type_id}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.client_type_id ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        disabled={!quotationId && !selectedQuotation}
                                    >
                                        <option value="">{t('companies_create.select_client_type')}</option>
                                        {clientTypes && clientTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.client_type_id && (
                                        <p className="text-xs text-red-600 mt-1">{errors.client_type_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Address - Wajib */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.city')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.city ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.city_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.city && (
                                        <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.province')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="province"
                                        value={formData.province}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.province ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.province_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.province && (
                                        <p className="text-xs text-red-600 mt-1">{errors.province}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.country')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.country ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.country_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.country && (
                                        <p className="text-xs text-red-600 mt-1">{errors.country}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.postal_code')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text" // Ubah dari number ke text untuk fleksibilitas
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.postal_code ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.postal_code_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.postal_code && (
                                        <p className="text-xs text-red-600 mt-1">{errors.postal_code}</p>
                                    )}
                                </div>
                            </div>

                            {/* Business Details - TIDAK WAJIB */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.vat_number')}
                                    </label>
                                    <input
                                        type="text" // Ubah dari number ke text
                                        name="vat_number"
                                        value={formData.vat_number}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder={t('companies_create.vat_number_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.nib')}
                                    </label>
                                    <input
                                        type="text"
                                        name="nib"
                                        value={formData.nib}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder={t('companies_create.nib_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.website')}
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder={t('companies_create.website_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information - Semua Wajib */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                <User className="w-5 h-5" />
                                {t('companies_create.contact_information')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.contact_person')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.contact_person ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.contact_person_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.contact_person && (
                                        <p className="text-xs text-red-600 mt-1">{errors.contact_person}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.position')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_position"
                                        value={formData.contact_position}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.contact_position ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.position_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.contact_position && (
                                        <p className="text-xs text-red-600 mt-1">{errors.contact_position}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.email')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={formData.contact_email}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.contact_email ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.email_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.contact_email && (
                                        <p className="text-xs text-red-600 mt-1">{errors.contact_email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('companies_create.phone')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.contact_phone ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder={t('companies_create.phone_placeholder')}
                                        disabled={!quotationId && !selectedQuotation}
                                    />
                                    {errors.contact_phone && (
                                        <p className="text-xs text-red-600 mt-1">{errors.contact_phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Logo Upload - Opsional */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    {t('companies_create.company_logo')}
                                </h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-teal-500 transition">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                name="logo"
                                                onChange={handleInputChange}
                                                accept="image/*"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={!quotationId && !selectedQuotation}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {t('companies_create.file_requirements')}
                                            </p>
                                        </div>
                                        {logoPreview && (
                                            <div className="w-16 h-16">
                                                <img 
                                                    src={logoPreview} 
                                                    alt={t('companies_create.logo_preview')}
                                                    className="w-full h-full object-cover rounded-lg border border-gray-300"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                        >
                            {t('companies_create.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!quotationId && !selectedQuotation) || quotationUsedError}
                            className={`px-6 py-2 font-medium rounded-lg flex items-center gap-2 ${
                                isSubmitting || (!quotationId && !selectedQuotation) || quotationUsedError
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-teal-700 hover:bg-teal-800 text-white'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {t('companies_create.creating')}
                                </>
                            ) : (
                                t('companies_create.create_client')
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Create;