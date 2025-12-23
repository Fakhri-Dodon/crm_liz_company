// resources/js/Components/Companies/Create.jsx
import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check } from 'lucide-react';
import { router } from '@inertiajs/react';

const Create = ({ isOpen, onClose, clientTypes, quotationId, onSuccess }) => {
    // Debug props
    console.log('Create modal props:', { 
        isOpen, 
        clientTypesLength: clientTypes?.length, 
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
        quotation_id: quotationId || '', // Pastikan quotation_id ada
        lead_id: '' // Tambahkan lead_id
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    // Reset form ketika modal dibuka
    useEffect(() => {
        if (isOpen) {
            console.log('Modal opened, fetching leads...');
            fetchLeads();
            setFormData(prev => ({
                ...prev,
                quotation_id: quotationId || '', // Set quotation_id dari props
                lead_id: '' // Reset lead_id
            }));
        }
    }, [isOpen, quotationId]);

    const fetchLeads = async () => {
        setLoadingLeads(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            console.log('Fetching leads with CSRF:', csrfToken);
            
            const response = await fetch('/companies/get-leads', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'include',
            });

            console.log('Leads response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch leads: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Leads data received:', data);
            
            if (data.success) {
                setLeads(data.data || []);
                console.log('Leads set:', data.data?.length || 0);
            } else {
                console.error('Leads API not successful:', data);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleLeadSelect = (lead) => {
        console.log('Lead selected:', lead);
        setSelectedLead(lead);
        setFormData(prev => ({
            ...prev,
            company_name: lead.company_name || '',
            contact_email: lead.email || '',
            contact_phone: lead.phone || '',
            contact_person: lead.contact_person || 'Contact Person',
            lead_id: lead.id // Set lead_id
        }));
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data before submit:', formData);
        console.log('Selected lead:', selectedLead);
        console.log('Quotation ID from props:', quotationId);

        try {
            const formDataToSend = new FormData();
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            // Append semua data form termasuk lead_id dan quotation_id
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                // Kirim semua nilai termasuk string kosong (kecuali null/undefined)
                if (value !== null && value !== undefined) {
                    formDataToSend.append(key, value);
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
                    
                    if (data.errors.contact_email && data.errors.contact_email.includes('already been taken')) {
                        alert(`Email "${formData.contact_email}" sudah terdaftar di sistem. Silakan gunakan email lain.`);
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
                setSelectedLead(null);
                
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
                        {/* Debug Info (optional) */}
                        <div className="text-xs text-gray-500">
                            <div>Lead ID: {formData.lead_id || 'Not selected'}</div>
                            <div>Quotation ID: {formData.quotation_id || 'None'}</div>
                        </div>

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

                        {/* Lead Selection Section */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Select from Existing Lead (Optional)
                            </h3>
                            
                            {loadingLeads ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-600 mt-2">Loading leads...</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {leads.map(lead => (
                                        <div
                                            key={lead.id}
                                            onClick={() => handleLeadSelect(lead)}
                                            className={`p-3 border rounded-lg cursor-pointer transition ${
                                                selectedLead?.id === lead.id
                                                    ? 'border-blue-500 bg-blue-100'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{lead.company_name}</div>
                                                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                        <Mail className="w-3 h-3" /> {lead.email}
                                                        <Phone className="w-3 h-3 ml-2" /> {lead.phone}
                                                    </div>
                                                </div>
                                                {selectedLead?.id === lead.id && (
                                                    <Check className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {leads.length === 0 && (
                                        <div className="text-center py-4 text-gray-500 text-sm">
                                            No leads available. Fill the form manually.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hidden fields untuk IDs */}
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
                                    >
                                        <option value="">Select Type</option>
                                        {clientTypes && clientTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errors.client_type_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.client_type_id}</p>
                                    )}
                                </div>

                                {/* VAT Number */}
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
                                    />
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
                                        type="number"
                                        name="postal_code"
                                        value={formData.postal_code}
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
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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