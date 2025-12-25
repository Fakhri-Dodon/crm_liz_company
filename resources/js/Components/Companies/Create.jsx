// resources/js/Components/Companies/Create.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check, ChevronDown, Search } from 'lucide-react';
import { router } from '@inertiajs/react';

const Create = ({ isOpen, onClose, clientTypes, quotationId, onSuccess }) => {
    // Debug props
    console.log('Create modal props:', { 
        isOpen, 
        clientTypes: clientTypes || [], 
        clientTypesLength: clientTypes?.length || 0, 
        quotationId,
        onClose: typeof onClose,
        onSuccess: typeof onSuccess 
    });

    // State untuk menyimpan data form
    const [formData, setFormData] = useState({
        company_name: '',
        client_type_id: '',
        status: 'active',
        address: '',
        city: '',
        province: '',
        country: '',
        postal_code: '',
        vat_number: '',
        nib: '',
        website: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        contact_position: '',
        logo: null,
        quotation_id: quotationId || '',
        lead_id: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State baru untuk quotations
    const [quotations, setQuotations] = useState([]);
    const [loadingQuotations, setLoadingQuotations] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [quotationSearch, setQuotationSearch] = useState('');
    
    // State untuk lead dari quotation yang dipilih
    const [quotationLead, setQuotationLead] = useState(null);
    const [loadingLead, setLoadingLead] = useState(false);

    // Reset form ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            console.log('Modal opened, fetching accepted quotations...');
            console.log('Client types available:', clientTypes?.length || 0);
            
            // Log semua client types untuk debugging
            if (clientTypes && clientTypes.length > 0) {
                console.log('Available client types:', clientTypes.map(ct => ({ id: ct.id, name: ct.name })));
            }
            
            fetchAcceptedQuotations();
            
            // Reset semua state
            setFormData({
                company_name: '',
                client_type_id: '',
                status: 'active',
                address: '',
                city: '',
                province: '',
                country: '',
                postal_code: '',
                vat_number: '',
                nib: '',
                website: '',
                contact_person: '',
                contact_email: '',
                contact_phone: '',
                contact_position: '',
                logo: null,
                quotation_id: quotationId || '',
                lead_id: ''
            });
            setSelectedQuotation(null);
            setQuotationLead(null);
            setQuotationSearch('');
        }
    }, [isOpen, quotationId]);

    // Fetch quotations dengan status accepted
    const fetchAcceptedQuotations = async () => {
        setLoadingQuotations(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            console.log('Fetching accepted quotations...');
            
            const response = await fetch('/companies/get-accepted-quotations', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'include',
            });

            console.log('Quotations response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                
                // Jika server return success dengan data kosong
                if (errorData.success && Array.isArray(errorData.data)) {
                    setQuotations([]);
                    console.log('No quotations available:', errorData.message || '');
                    return;
                }
                
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Quotations data received:', data);
            
            if (data.success) {
                setQuotations(data.data || []);
                console.log('Quotations loaded:', data.data?.length || 0, 'items');
                
                // Jika ada quotationId dari props, auto-select
                if (quotationId && data.data && data.data.length > 0) {
                    const foundQuotation = data.data.find(q => q.id === quotationId);
                    if (foundQuotation) {
                        console.log('Auto-selecting quotation from props:', quotationId);
                        await handleQuotationSelect(foundQuotation);
                    } else {
                        console.warn('Quotation not found in list:', quotationId);
                    }
                }
            } else {
                console.warn('API returned not successful:', data);
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
        console.log('Quotation selected:', quotation);
        setSelectedQuotation(quotation);
        setQuotationLead(null); // Reset lead sebelumnya
        
        // Set quotation_id di form
        setFormData(prev => ({
            ...prev,
            quotation_id: quotation.id,
            lead_id: '' // Reset lead_id dulu, akan diisi setelah fetch lead
        }));
        
        // Fetch lead data dari quotation ini
        await fetchLeadFromQuotation(quotation.id);
    };

    // Fetch lead data dari quotation
    const fetchLeadFromQuotation = async (quotationId) => {
        setLoadingLead(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch(`/companies/get-lead-from-quotation/${quotationId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch lead: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Lead from quotation data:', data);
            
            if (data.success && data.data) {
                const lead = data.data;
                setQuotationLead(lead);
                
                // Auto-fill form dengan data lead
                setFormData(prev => ({
                    ...prev,
                    company_name: lead.company_name || prev.company_name,
                    contact_person: lead.contact_person || prev.contact_person,
                    contact_email: lead.email || prev.contact_email,
                    contact_phone: lead.phone || prev.contact_phone,
                    lead_id: lead.id || '',
                    // Tambahkan field alamat jika ada di lead
                    address: lead.address || prev.address,
                    city: lead.city || prev.city,
                    province: lead.province || prev.province,
                    country: lead.country || prev.country,
                    // Reset fields lain agar tidak ter-overwrite
                }));
            } else {
                console.warn('No lead found for this quotation');
                // Jika tidak ada lead, tetap set quotation_id
                setFormData(prev => ({
                    ...prev,
                    lead_id: '' // Kosongkan lead_id
                }));
            }
        } catch (error) {
            console.error('Error fetching lead from quotation:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoadingLead(false);
        }
    };

    // Clear quotation selection
    const clearQuotationSelection = () => {
        setSelectedQuotation(null);
        setQuotationLead(null);
        setFormData(prev => ({
            ...prev,
            quotation_id: '',
            lead_id: '',
            company_name: '',
            contact_person: '',
            contact_email: '',
            contact_phone: '',
            address: '',
            city: '',
            province: '',
            country: ''
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
        const newValue = type === 'file' ? files[0] : value;
        
        console.log(`Input changed: ${name} = ${newValue}`);
        
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data before submit:', formData);
        console.log('Selected quotation:', selectedQuotation);
        console.log('Quotation lead:', quotationLead);
        console.log('Quotation ID from props:', quotationId);

        // Validasi sebelum submit
        if (!formData.company_name) {
            setErrors({ submit: 'Company name is required' });
            setIsSubmitting(false);
            return;
        }

        if (!formData.contact_email) {
            setErrors({ submit: 'Contact email is required' });
            setIsSubmitting(false);
            return;
        }

        if (!formData.contact_person) {
            setErrors({ submit: 'Contact person is required' });
            setIsSubmitting(false);
            return;
        }

        if (!formData.contact_phone) {
            setErrors({ submit: 'Contact phone is required' });
            setIsSubmitting(false);
            return;
        }

        if (!formData.client_type_id) {
            setErrors({ submit: 'Client type is required' });
            setIsSubmitting(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // Append semua data form
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (value !== null && value !== undefined) {
                    if (key === 'logo' && value instanceof File) {
                        formDataToSend.append(key, value);
                    } else if (value !== '') {
                        formDataToSend.append(key, value);
                    }
                    console.log(`Appended ${key}:`, value);
                }
            });

            // Backup: Jika ada quotation_id dari prop tapi tidak ada di formData
            if (quotationId && !formData.quotation_id) {
                formDataToSend.append('quotation_id', quotationId);
                console.log('Added quotation_id from prop:', quotationId);
            }

            // Debug: Tampilkan semua entries
            console.log('=== FORM DATA ENTRIES ===');
            for (let [key, value] of formDataToSend.entries()) {
                console.log(`${key}: ${value}`);
            }

            const response = await fetch('/companies', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: formDataToSend,
                credentials: 'include',
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    console.error('Validation errors:', data.errors);
                    setErrors(data.errors);
                    
                    if (data.errors.contact_email) {
                        const errorMsg = Array.isArray(data.errors.contact_email) 
                            ? data.errors.contact_email.join(', ')
                            : data.errors.contact_email;
                        alert(`Email error: ${errorMsg}`);
                    }
                    
                    throw new Error('Validation failed');
                } else {
                    throw new Error(data.message || `Failed to create client (${response.status})`);
                }
            } else {
                // SUCCESS
                alert(data.message || 'Client created successfully!');
                
                // Tutup modal
                onClose();
                
                // Reset form
                setFormData({
                    company_name: '',
                    client_type_id: '',
                    status: 'active',
                    address: '',
                    city: '',
                    province: '',
                    country: '',
                    postal_code: '',
                    vat_number: '',
                    nib: '',
                    website: '',
                    contact_person: '',
                    contact_email: '',
                    contact_phone: '',
                    contact_position: '',
                    logo: null,
                    quotation_id: '',
                    lead_id: ''
                });
                setSelectedQuotation(null);
                setQuotationLead(null);
                
                // Panggil callback success jika ada
                if (onSuccess) {
                    onSuccess();
                }
                
                // Refresh data menggunakan Inertia
                console.log('Refreshing companies data...');
                router.reload({
                    only: ['companies', 'statistics'],
                    preserveScroll: true,
                    onSuccess: () => {
                        console.log('Companies data refreshed successfully');
                    },
                    onError: (errors) => {
                        console.error('Error refreshing data:', errors);
                    }
                });
            }
        } catch (error) {
            console.error('Error creating client:', error);
            if (!error.message.includes('Validation failed')) {
                setErrors(prev => ({ 
                    ...prev, 
                    submit: error.message || 'An error occurred. Please try again.' 
                }));
                alert(error.message || 'Failed to create client. Please try again.');
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
                        <h2 className="text-2xl font-bold text-gray-900">Create New Client</h2>
                        <p className="text-gray-600 mt-1">Add a new client to your portfolio</p>
                        {quotationId && (
                            <div className="mt-1 text-sm text-blue-600">
                                Creating from quotation: <strong>{quotationId}</strong>
                            </div>
                        )}
                        {/* Debug info */}
                        <div className="mt-1 text-xs text-gray-400">
                            Client Types: {clientTypes?.length || 0} available | 
                            Quotations: {quotations.length} available
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            console.log('Close button clicked');
                            onClose();
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="p-6 space-y-6">
                        {/* Error Alert */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800">{errors.submit}</p>
                                        <p className="text-sm text-red-600 mt-1">Please check your inputs and try again.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Client Type Warning */}
                        {(!clientTypes || clientTypes.length === 0) && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">No Client Types Available</p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            Please contact administrator to set up client types before creating a client.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quotation Selection Section */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Select from Accepted Quotation (Optional)
                            </h3>
                            <p className="text-sm text-blue-700 mb-4">
                                Select an accepted quotation to auto-fill client data from its lead
                            </p>
                            
                            {loadingQuotations ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-600 mt-2">Loading accepted quotations...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Selected Quotation Display */}
                                    {selectedQuotation && (
                                        <div className="bg-white border border-green-300 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-green-700">
                                                            {selectedQuotation.quotation_number}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                                            Accepted
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {selectedQuotation.subject}
                                                    </div>
                                                    {quotationLead && (
                                                        <div className="mt-2 text-sm">
                                                            <div className="font-medium text-gray-700">
                                                                {quotationLead.company_name}
                                                            </div>
                                                            <div className="text-gray-600 flex items-center gap-2 mt-1">
                                                                <Mail className="w-3 h-3" /> {quotationLead.email || 'No email'}
                                                                <Phone className="w-3 h-3 ml-2" /> {quotationLead.phone || 'No phone'}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {loadingLead && (
                                                        <div className="mt-2 text-sm text-gray-500">
                                                            Loading lead data...
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
                                    )}

                                    {/* Quotation List (jika belum ada yang dipilih) */}
                                    {!selectedQuotation && (
                                        <>
                                            {quotations.length > 0 ? (
                                                <>
                                                    {/* Search Input */}
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search by quotation number, subject, or company name..."
                                                            value={quotationSearch}
                                                            onChange={(e) => setQuotationSearch(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                                        {filteredQuotations.map(quotation => (
                                                            <div
                                                                key={quotation.id}
                                                                onClick={() => handleQuotationSelect(quotation)}
                                                                className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition last:border-b-0"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">
                                                                            {quotation.quotation_number}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 mt-1">
                                                                            {quotation.subject}
                                                                        </div>
                                                                        {quotation.lead && (
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                From: {quotation.lead.company_name}
                                                                            </div>
                                                                        )}
                                                                        <div className="mt-2">
                                                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                                                                Accepted
                                                                            </span>
                                                                            {quotation.accepted_at && (
                                                                                <span className="text-xs text-gray-500 ml-2">
                                                                                    {new Date(quotation.accepted_at).toLocaleDateString()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-6 border border-gray-200 rounded-lg bg-white">
                                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-sm text-gray-600 font-medium">No accepted quotations found</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        You can still create a client manually below.
                                                    </p>
                                                    <div className="mt-3 text-xs text-gray-400">
                                                        <p>To create from quotation:</p>
                                                        <p>1. Create a lead first</p>
                                                        <p>2. Create a quotation for that lead</p>
                                                        <p>3. Mark the quotation as "accepted"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hidden fields */}
                        <input type="hidden" name="lead_id" value={formData.lead_id || ''} />
                        <input type="hidden" name="quotation_id" value={formData.quotation_id || ''} />

                        {/* Company Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Company Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name *
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
                                        placeholder="Enter company name"
                                    />
                                    {errors.company_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>
                                    )}
                                </div>

                                {/* Client Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client Type *
                                    </label>
                                    <select
                                        name="client_type_id"
                                        value={formData.client_type_id}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.client_type_id ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        disabled={!clientTypes || clientTypes.length === 0}
                                    >
                                        <option value="">Select Client Type</option>
                                        {clientTypes && clientTypes.length > 0 ? (
                                            clientTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No client types available</option>
                                        )}
                                    </select>
                                    {errors.client_type_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.client_type_id}</p>
                                    )}
                                    {(!clientTypes || clientTypes.length === 0) && (
                                        <p className="mt-1 text-sm text-yellow-600">
                                            ⚠️ No client types configured. Please contact administrator.
                                        </p>
                                    )}
                                </div>

                                {/* VAT Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        VAT Number
                                    </label>
                                    <input
                                        type="text"
                                        name="vat_number"
                                        value={formData.vat_number}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Enter VAT number"
                                    />
                                    {errors.vat_number && (
                                        <p className="mt-1 text-sm text-red-600">{errors.vat_number}</p>
                                    )}
                                </div>

                                {/* NIB */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        NIB (Business Identification Number)
                                    </label>
                                    <input
                                        type="text"
                                        name="nib"
                                        value={formData.nib}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Enter NIB"
                                    />
                                    {errors.nib && (
                                        <p className="mt-1 text-sm text-red-600">{errors.nib}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Address Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.address ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter company address"
                                    />
                                    {errors.address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.city ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter city"
                                    />
                                    {errors.city && (
                                        <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Province
                                    </label>
                                    <input
                                        type="text"
                                        name="province"
                                        value={formData.province}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.province ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter province"
                                    />
                                    {errors.province && (
                                        <p className="mt-1 text-sm text-red-600">{errors.province}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.country ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter country"
                                    />
                                    {errors.country && (
                                        <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Enter postal code"
                                    />
                                    {errors.postal_code && (
                                        <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="https://example.com"
                                    />
                                    {errors.website && (
                                        <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Person */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Contact Person
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person Name *
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
                                        placeholder="Enter contact person name"
                                    />
                                    {errors.contact_person && (
                                        <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_position"
                                        value={formData.contact_position}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Enter position"
                                    />
                                    {errors.contact_position && (
                                        <p className="mt-1 text-sm text-red-600">{errors.contact_position}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
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
                                        placeholder="Enter email address"
                                    />
                                    {errors.contact_email && (
                                        <div className="mt-1 text-sm text-red-600">
                                            {Array.isArray(errors.contact_email) 
                                                ? errors.contact_email.join(', ')
                                                : errors.contact_email}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone *
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
                                        placeholder="Enter phone number"
                                    />
                                    {errors.contact_phone && (
                                        <p className="mt-1 text-sm text-red-600">{errors.contact_phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status & Logo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status</h3>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={formData.status === 'active'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                                        />
                                        <span className="ml-2 text-gray-700">Active</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="inactive"
                                            checked={formData.status === 'inactive'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                                        />
                                        <span className="ml-2 text-gray-700">Inactive</span>
                                    </label>
                                </div>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Logo</h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            name="logo"
                                            onChange={handleInputChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <span className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                                            Click to upload logo
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 2MB</p>
                                    </label>
                                    {formData.logo && (
                                        <div className="mt-2 text-sm text-green-600">
                                            ✓ {formData.logo.name || 'File selected'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                console.log('Cancel button clicked');
                                onClose();
                            }}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!clientTypes || clientTypes.length === 0)}
                            className={`px-6 py-2 font-medium rounded-lg flex items-center gap-2 ${
                                (!clientTypes || clientTypes.length === 0)
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                'Create Client'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Create;