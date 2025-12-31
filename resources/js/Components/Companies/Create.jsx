// resources/js/Components/Companies/Create.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check, ChevronDown, Search, Briefcase } from 'lucide-react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';

const Create = ({ isOpen, onClose, clientTypes, quotationId, onSuccess }) => {
    const { flash } = usePage().props;
    
    // State untuk menyimpan data form
    const [formData, setFormData] = useState({
        client_code: '', // Field yang benar untuk nama perusahaan
        company_name: '', // Untuk menampilkan nama perusahaan
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
        lead_id: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        contact_position: ''
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
    
    // State untuk contact form (show/hide)
    const [showContactForm, setShowContactForm] = useState(false);

    // Setup axios defaults
    useEffect(() => {
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.withCredentials = true;
        axios.defaults.headers.common['Accept'] = 'application/json';
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
    }, []);

    // Reset form ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            console.log('Modal opened...');
            
            // Reset semua state
            setFormData({
                client_code: '',
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
                lead_id: '',
                contact_person: '',
                contact_email: '',
                contact_phone: '',
                contact_position: ''
            });
            
            setSelectedQuotation(null);
            setQuotationLead(null);
            setQuotationSearch('');
            setLogoPreview(null);
            setShowContactForm(false);
            setErrors({});
            
            // Fetch data berdasarkan kondisi
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
            console.log('Fetching accepted quotations...');
            const response = await axios.get('/companies/get-accepted-quotations');
            
            console.log('Quotations response:', response);
            
            if (response && response.data && response.data.success) {
                setQuotations(response.data.data || []);
                console.log('Quotations loaded:', response.data.data?.length || 0);
            } else {
                console.error('Failed to fetch quotations:', response?.data?.message);
                setQuotations([]);
            }
        } catch (error) {
            console.error('Error fetching quotations:', error);
            console.error('Error details:', error.response?.data);
            setQuotations([]);
            
            // Show user-friendly error
            if (error.response?.status === 404) {
                alert('Endpoint not found. Please check if the route is properly configured.');
            } else {
                alert(`Failed to load quotations: ${error.response?.data?.message || error.message}`);
            }
        } finally {
            setLoadingQuotations(false);
        }
    };

    // Handle quotation selection
    const handleQuotationSelect = async (quotation) => {
        console.log('Selecting quotation:', quotation);
        setSelectedQuotation(quotation);
        setQuotationLead(null);
        
        // Set quotation_id di form
        setFormData(prev => ({
            ...prev,
            quotation_id: quotation.id,
            lead_id: quotation.lead?.id || ''
        }));
        
        // Fetch lead data dari quotation ini
        await fetchLeadFromQuotation(quotation.id);
    };

    // Fetch lead data dari quotation
    const fetchLeadFromQuotation = async (quotationId) => {
        if (!quotationId) {
            console.log('No quotation ID provided');
            return;
        }
        
        console.log('Fetching lead from quotation:', quotationId);
        setLoadingLead(true);
        try {
            const response = await axios.get(`/companies/get-lead-from-quotation/${quotationId}`);
            
            console.log('Lead response:', response);
            
            if (response && response.data && response.data.success) {
                const leadData = response.data.data;
                console.log('Lead data:', leadData);
                setQuotationLead(leadData);
                
                // Auto-fill form dengan data lead
                setFormData(prev => ({
                    ...prev,
                    client_code: generateClientCode(leadData), // Generate client code
                    company_name: leadData.company_name || prev.company_name,
                    city: leadData.city || prev.city,
                    province: leadData.province || prev.province,
                    country: leadData.country || prev.country,
                    postal_code: leadData.postal_code || prev.postal_code,
                    lead_id: leadData.id || '',
                    // Auto-fill contact data dari lead
                    contact_person: leadData.contact_person || prev.contact_person,
                    contact_email: leadData.email || prev.contact_email,
                    contact_phone: leadData.phone || prev.contact_phone,
                    contact_position: 'Contact Person' // Default position
                }));
                
                // Auto-show contact form
                setShowContactForm(true);
            } else {
                console.log('No lead data found or quotation already has company');
                // Jika tidak ada lead, tetap set quotation_id
                setFormData(prev => ({
                    ...prev,
                    lead_id: ''
                }));
                setShowContactForm(true); // Masih show form untuk input manual
                
                // Show message to user
                alert(response?.data?.message || 'No lead data found for this quotation');
            }
        } catch (error) {
            console.error('Error fetching lead from quotation:', error);
            console.error('Error details:', error.response?.data);
            
            // Show user-friendly error
            const errorMessage = error.response?.data?.message || error.message;
            alert(`Failed to load lead data: ${errorMessage}`);
            
            // Show form untuk input manual jika error
            setShowContactForm(true);
        } finally {
            setLoadingLead(false);
        }
    };

    // Generate client code dari lead
    const generateClientCode = (leadData) => {
        if (!leadData?.company_name) return '';
        
        // Ambil 3 huruf pertama dari nama perusahaan
        const companyName = leadData.company_name.replace(/[^a-zA-Z0-9]/g, '');
        const initials = companyName.substring(0, 3).toUpperCase();
        
        // Tambahkan tahun dan angka random
        const year = new Date().getFullYear().toString().substring(2);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `${initials}${year}${randomNum}`;
    };

    // Clear quotation selection
    const clearQuotationSelection = () => {
        setSelectedQuotation(null);
        setQuotationLead(null);
        setFormData(prev => ({
            ...prev,
            quotation_id: '',
            lead_id: '',
            client_code: '',
            company_name: '',
            city: '',
            province: '',
            country: '',
            postal_code: '',
            contact_person: '',
            contact_email: '',
            contact_phone: '',
            contact_position: ''
        }));
        setQuotationSearch('');
        setShowContactForm(false);
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

    // Toggle contact form
    const toggleContactForm = () => {
        setShowContactForm(!showContactForm);
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data before submit:', formData);

        // Validasi dasar
        const newErrors = {};
        
        if (!formData.client_code) {
            newErrors.client_code = 'Client code is required';
        }
        
        if (!formData.client_type_id) {
            newErrors.client_type_id = 'Client type is required';
        }
        
        // Validasi contact
        if (!formData.contact_person) {
            newErrors.contact_person = 'Contact person is required';
        }
        
        if (!formData.contact_email) {
            newErrors.contact_email = 'Contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = 'Invalid email format';
        }
        
        if (!formData.contact_phone) {
            newErrors.contact_phone = 'Contact phone is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            
            // Append semua data ke FormData dengan nama field yang benar
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    if (key === 'logo' && value instanceof File) {
                        formDataToSend.append('logo', value);
                    } else if (key === 'company_name') {
                        // Tidak perlu dikirim, karena di database adalah client_code
                        // Tapi kita bisa simpan sebagai note atau informasi tambahan
                    } else {
                        formDataToSend.append(key, value.toString());
                    }
                }
            });

            // Tambahkan contact person data
            if (formData.contact_person) {
                formDataToSend.append('contact_name', formData.contact_person);
                formDataToSend.append('contact_email', formData.contact_email);
                formDataToSend.append('contact_phone', formData.contact_phone);
                formDataToSend.append('contact_position', formData.contact_position || 'Contact Person');
                formDataToSend.append('is_primary', '1');
            }

            console.log('Sending form data...');
            
            const response = await axios.post('/companies', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Server response:', response);

            if (response && response.data && response.data.success) {
                alert(response.data.message || 'Client created successfully!');
                
                // Tutup modal
                onClose();
                
                // Reset form
                setFormData({
                    client_code: '',
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
                    lead_id: '',
                    contact_person: '',
                    contact_email: '',
                    contact_phone: '',
                    contact_position: ''
                });
                setSelectedQuotation(null);
                setQuotationLead(null);
                setLogoPreview(null);
                setShowContactForm(false);
                
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
                setErrors(error.response.data.errors || {});
                alert('Please check the form for errors.');
            } else {
                const errorMsg = error.response?.data?.message || error.message || 'An error occurred.';
                setErrors(prev => ({ ...prev, submit: errorMsg }));
                alert(`Error creating client: ${errorMsg}`);
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
                        {/* Quotation Selection Section */}
                        {!quotationId && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Select from Accepted Quotation (Optional)
                                </h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    Select an accepted quotation to auto-fill company and contact data
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
                                                        {selectedQuotation.lead && (
                                                            <div className="mt-2 text-sm">
                                                                <div className="font-medium text-gray-700">
                                                                    {selectedQuotation.lead.company_name}
                                                                </div>
                                                                <div className="text-gray-600">
                                                                    {selectedQuotation.lead.contact_person}
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
                                        {!selectedQuotation && (
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
                                                                        <div className="text-xs text-green-600 mt-1 font-medium">
                                                                            Total: Rp{quotation.total?.toLocaleString('id-ID')}
                                                                        </div>
                                                                    </div>
                                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                            <p className="text-sm text-gray-600 font-medium">
                                                                {quotations.length === 0 
                                                                    ? 'No accepted quotations found' 
                                                                    : 'No matching quotations found'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                You can create a client manually below.
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
                                {/* Client Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client Code *
                                    </label>
                                    <input
                                        type="text"
                                        name="client_code"
                                        value={formData.client_code}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                                            errors.client_code ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        required
                                        placeholder="CLIENT001"
                                    />
                                    {errors.client_code && (
                                        <p className="text-xs text-red-600 mt-1">{errors.client_code}</p>
                                    )}
                                    {formData.company_name && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Company: {formData.company_name}
                                        </p>
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
                                        type="text"
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
                                        type="text"
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
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
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

                        {/* Status & Logo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
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
                                            <p className="text-xs text-gray-500 mt-1">JPEG, PNG, JPG, GIF (Max 2MB)</p>
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
                            disabled={isSubmitting || !formData.client_code || !formData.client_type_id}
                            className={`px-6 py-2 font-medium rounded-lg flex items-center gap-2 ${
                                isSubmitting || !formData.client_code || !formData.client_type_id
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