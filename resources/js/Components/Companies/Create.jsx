// resources/js/Components/Companies/Create.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check, ChevronDown, Search } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

const Create = ({ isOpen, onClose, clientTypes, quotationId, onSuccess }) => {
    const { flash } = usePage().props;
    
    // State untuk menyimpan data form - SESUAI DENGAN VALIDASI CONTROLLER
    const [formData, setFormData] = useState({
        company_name: '', // Wajib - akan jadi client_code
        client_type_id: '', // Wajib
        contact_person: '', // Wajib
        contact_email: '', // Wajib
        contact_phone: '', // Wajib
        contact_position: '', // Opsional
        city: '',
        province: '',
        country: '',
        postal_code: '',
        vat_number: '',
        nib: '',
        website: '',
        logo: null,
        status: 'active', // Wajib
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

    // Setup axios defaults
    useEffect(() => {
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.withCredentials = true;
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
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
                vat_number: '',
                nib: '',
                website: '',
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
            const response = await axios.get('/companies/get-accepted-quotations');
            
            if (response && response.data && response.data.success) {
                setQuotations(response.data.data || []);
            } else {
                setQuotations([]);
            }
        } catch (error) {
            console.error('Error:', error);
            setQuotations([]);
        } finally {
            setLoadingQuotations(false);
        }
    };

    // Handle quotation selection
    const handleQuotationSelect = async (quotation) => {
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
            contact_position: quotation.lead?.position || 'Contact Person'
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
        try {
            const response = await axios.get(`/companies/get-lead-from-quotation/${quotationId}`);
            
            if (response && response.data && response.data.success) {
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
                    contact_position: leadData.position || 'Contact Person',
                    city: leadData.city || prev.city,
                    province: leadData.province || prev.province,
                    country: leadData.country || prev.country,
                    postal_code: leadData.postal_code || prev.postal_code
                }));
            }
        } catch (error) {
            console.error('Error:', error);
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

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data before submit:', formData);

        // Buat FormData untuk upload file
        const formDataToSend = new FormData();
        
        // Append semua field WAJIB sesuai validasi controller
        const requiredFields = [
            'company_name',
            'client_type_id',
            'contact_person',
            'contact_email',
            'contact_phone',
            'status'
        ];
        
        // Cek field wajib
        requiredFields.forEach(field => {
            if (!formData[field]) {
                setErrors(prev => ({
                    ...prev,
                    [field]: `${field.replace('_', ' ')} wajib diisi`
                }));
            }
        });

        // Cek jika ada error validation manual
        if (Object.keys(errors).length > 0) {
            setIsSubmitting(false);
            return;
        }

        // Append semua data ke FormData
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (key === 'logo' && value instanceof File) {
                    formDataToSend.append('logo', value);
                } else if (value !== '') {
                    formDataToSend.append(key, value.toString());
                }
            }
        });

        // Pastikan ada quotation_id jika dari prop
        if (quotationId && !formData.quotation_id) {
            formDataToSend.append('quotation_id', quotationId);
        }

        try {
            console.log('Sending form data...');
            
            const response = await axios.post('/companies', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Server response:', response);

            if (response && response.data && response.data.success) {
                // Success message
                alert(response.data.message || 'Client created successfully!');
                
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
                alert(response?.data?.message || 'Failed to create client');
            }

        } catch (error) {
            console.error('Error creating client:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 422) {
                // Set validation errors
                setErrors(error.response.data.errors || {});
                
                // Show validation error summary
                const errorMessages = Object.values(error.response.data.errors || {})
                    .flat()
                    .join('\n');
                
                if (errorMessages) {
                    alert('Validation errors:\n' + errorMessages);
                }
            } else {
                alert(`Error creating client: ${error.response?.data?.message || error.message}`);
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
                                    Select from Accepted Quotation (Optional)
                                </h3>
                                
                                {loadingQuotations ? (
                                    <div className="text-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-sm text-gray-600 mt-2">Loading quotations...</p>
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
                                                                Accepted
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
                                                        placeholder="Search quotations..."
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
                                                                        <div className="font-medium text-gray-900">
                                                                            {quotation.quotation_number}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 mt-1">
                                                                            {quotation.subject}
                                                                        </div>
                                                                        {quotation.lead && (
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                {quotation.lead.company_name}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <p className="text-sm text-gray-600 font-medium">
                                                                No quotations found
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Company Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Company Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name - Wajib */}
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
                                        <p className="text-xs text-red-600 mt-1">{errors.company_name}</p>
                                    )}
                                </div>

                                {/* Client Type - Wajib */}
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
                                    >
                                        <option value="">Select Client Type</option>
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

                            {/* Address */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Postal Code
                                    </label>
                                    <input
                                        type="number"
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Business Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        VAT Number
                                    </label>
                                    <input
                                        type="number"
                                        name="vat_number"
                                        value={formData.vat_number}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        NIB
                                    </label>
                                    <input
                                        type="text"
                                        name="nib"
                                        value={formData.nib}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
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
                                </div>
                            </div>
                        </div>

                        {/* Contact Information - Semua Wajib */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                <User className="w-5 h-5" />
                                Contact Information *
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Person *
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
                                    />
                                    {errors.contact_person && (
                                        <p className="text-xs text-red-600 mt-1">{errors.contact_person}</p>
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
                                    />
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
                                    />
                                    {errors.contact_email && (
                                        <p className="text-xs text-red-600 mt-1">{errors.contact_email}</p>
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
                                    />
                                    {errors.contact_phone && (
                                        <p className="text-xs text-red-600 mt-1">{errors.contact_phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status & Logo Upload */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status *</h3>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={formData.status === 'active'}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                                            required
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
                                    <p className="text-xs text-red-600 mt-1">{errors.status}</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Logo</h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-teal-500 transition">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                name="logo"
                                                onChange={handleInputChange}
                                                accept="image/*"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                JPEG, PNG, JPG, GIF (Max 2MB)
                                            </p>
                                        </div>
                                        {logoPreview && (
                                            <div className="w-16 h-16">
                                                <img 
                                                    src={logoPreview} 
                                                    alt="Logo preview" 
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-2 font-medium rounded-lg flex items-center gap-2 ${
                                isSubmitting
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-teal-700 hover:bg-teal-800 text-white'
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