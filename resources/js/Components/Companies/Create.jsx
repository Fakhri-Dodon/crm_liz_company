// resources/js/Components/Companies/Create.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check, ChevronDown, Search } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

const Create = ({ isOpen, onClose, clientTypes, quotationId, onSuccess }) => {
    const { flash } = usePage().props;
    
    // State untuk menyimpan data form
    const [formData, setFormData] = useState({
        company_name: '', // Akan disimpan sebagai client_code
        client_type_id: '',
        status: 'active',
        city: '',
        province: '',
        country: '',
        postal_code: '',
        vat_number: '',
        nib: '',
        website: '',
        logo: null,
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
            
            if (!quotationId) {
                fetchAcceptedQuotations();
            } else {
                fetchLeadFromQuotation(quotationId);
            }
            
            // Reset state
            setFormData({
                company_name: '',
                client_type_id: '',
                status: 'active',
                city: '',
                province: '',
                country: '',
                postal_code: '',
                vat_number: '',
                nib: '',
                website: '',
                logo: null,
                quotation_id: quotationId || '',
                lead_id: ''
            });
            setSelectedQuotation(null);
            setQuotationLead(null);
            setQuotationSearch('');
            setLogoPreview(null);
        }
    }, [isOpen, quotationId]);

    // Fetch quotations dengan status accepted
    const fetchAcceptedQuotations = async () => {
        setLoadingQuotations(true);
        try {
            const response = await axios.get('/companies/get-accepted-quotations');
            
            if (response && response.data && response.data.success) {
                setQuotations(response.data.data || []);
                
                // Jika ada quotationId dari props, auto-select
                if (quotationId && response.data.data && response.data.data.length > 0) {
                    const foundQuotation = response.data.data.find(q => q.id === quotationId);
                    if (foundQuotation) {
                        await handleQuotationSelect(foundQuotation);
                    }
                }
            } else {
                setQuotations([]);
            }
        } catch (error) {
            console.error('Error fetching quotations:', error);
            setQuotations([]);
            alert(`Failed to load quotations: ${error.response?.data?.message || error.message}`);
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
            lead_id: ''
        }));
        
        // Fetch lead data dari quotation ini
        await fetchLeadFromQuotation(quotation.id);
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
                
                // Auto-fill form dengan data lead (hanya field yang ada di companies)
                setFormData(prev => ({
                    ...prev,
                    company_name: leadData.company_name || prev.company_name,
                    city: leadData.city || prev.city,
                    province: leadData.province || prev.province,
                    country: leadData.country || prev.country,
                    lead_id: leadData.id || '',
                }));
            } else {
                // Jika tidak ada lead, tetap set quotation_id
                setFormData(prev => ({
                    ...prev,
                    lead_id: ''
                }));
            }
        } catch (error) {
            console.error('Error fetching lead from quotation:', error);
            alert('Failed to load lead data: ' + (error.response?.data?.message || error.message));
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

    // Handle submit - SIMPLIFIED VERSION
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data before submit:', formData);

        // Validasi hanya field yang diperlukan
        if (!formData.company_name) {
            setErrors({ submit: 'Company name is required' });
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
            
            // Append hanya data yang akan dikirim ke backend
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    if (key === 'logo' && value instanceof File) {
                        formDataToSend.append(key, value);
                    } else {
                        formDataToSend.append(key, value.toString());
                    }
                }
            });

            // Jika ada quotation_id dari prop
            if (quotationId && !formData.quotation_id) {
                formDataToSend.append('quotation_id', quotationId);
            }

            const response = await axios.post('/companies', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Server response:', response);

            if (response && response.data && response.data.success) {
                alert(response.data.message);
                
                // Tutup modal
                onClose();
                
                // Reset form
                setFormData({
                    company_name: '',
                    client_type_id: '',
                    status: 'active',
                    city: '',
                    province: '',
                    country: '',
                    postal_code: '',
                    vat_number: '',
                    nib: '',
                    website: '',
                    logo: null,
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
            
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                alert('Please check the form for errors.');
            } else {
                setErrors(prev => ({ 
                    ...prev, 
                    submit: error.response?.data?.message || error.message || 'An error occurred.' 
                }));
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
                        {/* Info: Data kontak akan disimpan di lead jika ada */}
                        {formData.lead_id && (
                            <div className="mt-1 text-sm text-green-600">
                                ✓ Data kontak akan diambil dari lead
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
                        {/* Error Alert */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800">{errors.submit}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Flash Messages */}
                        {flash?.success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-700">{flash.success}</p>
                            </div>
                        )}
                        {flash?.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-700">{flash.error}</p>
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
                                            Please contact administrator to set up client types.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quotation Selection Section */}
                        {!quotationId && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Select from Accepted Quotation (Optional)
                                </h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    Select an accepted quotation to auto-fill company data from its lead
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
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Data kontak akan diambil dari lead ini
                                                                </div>
                                                            </div>
                                                        )}
                                                        {loadingLead && (
                                                            <div className="mt-2 flex items-center">
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                                <span className="text-sm text-gray-500">Loading lead data...</span>
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

                                        {/* Quotation List */}
                                        {!selectedQuotation && quotations.length > 0 && (
                                            <>
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
                                                                </div>
                                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {!selectedQuotation && quotations.length === 0 && (
                                            <div className="text-center py-6 border border-gray-200 rounded-lg bg-white">
                                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm text-gray-600 font-medium">No accepted quotations found</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    You can create a client manually below.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

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
                                    <p className="text-xs text-gray-500 mt-1">
                                        Akan disimpan sebagai client code
                                    </p>
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
                                                <option key={type.id} value={type.id}>{type.name} - {type.information}</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>No client types available</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* City */}
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
                                        placeholder="Enter city"
                                    />
                                </div>

                                {/* Province */}
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
                                        placeholder="Enter province"
                                    />
                                </div>

                                {/* Country */}
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
                                        placeholder="Enter country"
                                    />
                                </div>

                                {/* Postal Code */}
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
                                </div>
                            </div>

                            {/* Business Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </div>

                                {/* Website */}
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
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Logo</h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                name="logo"
                                                onChange={handleInputChange}
                                                accept="image/*"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Max size: 2MB (JPEG, PNG, JPG, GIF)</p>
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

                        {/* Info about contact data */}
                        {!formData.lead_id && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Contact Information Note</p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            Data kontak (email, phone, contact person) akan disimpan di tabel Leads jika membuat dari quotation.
                                            Untuk client manual, data kontak bisa ditambahkan nanti melalui menu edit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
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