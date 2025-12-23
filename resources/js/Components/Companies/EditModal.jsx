import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check, Image, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';

const EditModal = ({ isOpen, onClose, company, clientTypes, onUpdate }) => {
    // FIELD NAME HARUS SAMA PERSIS DENGAN CREATE FORM
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
        client_since: '',
        logo: null,
        logo_preview: '',
        delete_logo: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    // Initialize form data when company changes
    useEffect(() => {
        if (company && clientTypes.length > 0) {
            // KONVERSI DARI FIELD DATABASE KE FIELD CREATE FORM
            setFormData({
                company_name: company.name || '', // Database: name -> Form: company_name
                client_type_id: company.client_type_id || (clientTypes.length > 0 ? clientTypes[0].id : ''),
                status: company.is_active ? 'active' : 'inactive', // Database: is_active -> Form: status
                address: company.address || '',
                city: company.city || '',
                province: company.province || '',
                country: company.country || '',
                postal_code: company.postal_code?.toString() || '',
                vat_number: company.vat_number?.toString() || '',
                nib: company.nib || '',
                website: company.website || '',
                contact_person: company.contact_person || '', // Sama
                contact_email: company.email || '', // Database: email -> Form: contact_email
                contact_phone: company.phone || '', // Database: phone -> Form: contact_phone
                contact_position: company.position || '', // Database: position -> Form: contact_position
                client_since: company.client_since ? company.client_since.split('T')[0] : '',
                logo: null,
                logo_preview: company.logo_url || '',
                delete_logo: false
            });
            setLogoFile(null);
            setErrors({});
        }
    }, [company, clientTypes]);

    // Fetch leads (sama seperti Create)
    const fetchLeads = async () => {
        setLoadingLeads(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/companies/get-leads', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch leads');
            
            const data = await response.json();
            if (data.success) {
                setLeads(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoadingLeads(false);
        }
    };

    const handleLeadSelect = (lead) => {
        setSelectedLead(lead);
        setFormData(prev => ({
            ...prev,
            company_name: lead.company_name,
            contact_email: lead.email,
            contact_phone: lead.phone,
            contact_person: lead.contact_person || 'Contact Person',
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'radio') {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else if (type === 'file') {
            const file = files[0];
            if (file) {
                setLogoFile(file);
                const previewUrl = URL.createObjectURL(file);
                setFormData(prev => ({ 
                    ...prev, 
                    logo: file,
                    logo_preview: previewUrl,
                    delete_logo: false
                }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleRemoveLogo = () => {
        if (formData.logo_preview && formData.logo_preview.startsWith('blob:')) {
            URL.revokeObjectURL(formData.logo_preview);
        }
        setFormData(prev => ({ 
            ...prev, 
            logo: null,
            logo_preview: '',
            delete_logo: true 
        }));
        setLogoFile(null);
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
        const formDataToSend = new FormData();
        
        console.log('=== SUBMITTING EDIT FORM ===');
        console.log('Form data:', formData);
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Append semua field seperti Create form
        const fields = [
            'company_name',
            'client_type_id', 
            'status',
            'address',
            'city',
            'province',
            'country',
            'postal_code',
            'vat_number',
            'nib',
            'website',
            'contact_person',
            'contact_email',
            'contact_phone',
            'contact_position',
            'client_since'
        ];
        
        fields.forEach(field => {
            if (formData[field] !== null && formData[field] !== undefined && formData[field] !== '') {
                // Handle numeric fields
                if (field === 'postal_code' || field === 'vat_number') {
                    const numValue = parseInt(formData[field]);
                    if (!isNaN(numValue)) {
                        formDataToSend.append(field, numValue);
                    }
                } else if (field === 'client_type_id') {
                    const numValue = parseInt(formData[field]);
                    if (!isNaN(numValue)) {
                        formDataToSend.append(field, numValue);
                    }
                } else {
                    formDataToSend.append(field, formData[field]);
                }
            }
        });
        
        // Handle logo
        if (formData.logo) {
            formDataToSend.append('logo', formData.logo);
        }
        
        if (formData.delete_logo) {
            formDataToSend.append('delete_logo', '1');
        }

        console.log('=== SENDING DATA ===');
        for (let pair of formDataToSend.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
        }

        const response = await fetch(`/companies/${company.id}`, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
            body: formDataToSend,
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (!response.ok) {
            if (data.errors) {
                console.error('Validation errors:', data.errors);
                setErrors(data.errors);
                
                // Tampilkan alert khusus untuk email duplikat
                if (data.errors.contact_email && data.errors.contact_email.includes('already been taken')) {
                    alert(`Email "${formData.contact_email}" sudah terdaftar di sistem. Silakan gunakan email lain.`);
                }
                
                throw new Error('Validation failed');
            }
            throw new Error(data.message || 'Failed to update client');
        }

        // Success
        alert(data.message || 'Client updated successfully!');
        
        // Clean up blob URL if exists
        if (formData.logo_preview && formData.logo_preview.startsWith('blob:')) {
            URL.revokeObjectURL(formData.logo_preview);
        }
        
        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(data.data || company.id);
        }
        
        // Refresh data menggunakan Inertia.js
        console.log('Refreshing companies data after update...');
        router.reload({
            only: ['companies', 'statistics'],
            preserveScroll: true,
            onSuccess: () => {
                console.log('Companies data refreshed successfully');
            }
        });
        
        onClose();
    } catch (error) {
        console.error('Error updating client:', error);
        if (!error.message.includes('Validation failed')) {
            setErrors(prev => ({ 
                ...prev, 
                submit: error.message || 'An error occurred. Please try again.' 
            }));
            alert(error.message || 'Failed to update client. Please try again.');
        }
    } finally {
        setIsSubmitting(false);
    }
};

    const handleCancel = () => {
        // Clean up blob URL if exists
        if (formData.logo_preview && formData.logo_preview.startsWith('blob:')) {
            URL.revokeObjectURL(formData.logo_preview);
        }
        onClose();
    };

    if (!isOpen || !company) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Edit Client</h2>
                        <p className="text-gray-600 mt-1">
                            Editing: <span className="font-medium">{company.name}</span>
                            {company.client_code && (
                                <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                                    {company.client_code}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form - SAMA PERSIS DENGAN CREATE FORM */}
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

                        {/* Lead Selection Section (Optional untuk Edit) */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Load from Existing Lead (Optional)
                            </h3>
                            
                            {loadingLeads ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-600 mt-2">Loading leads...</p>
                                </div>
                            ) : leads.length > 0 ? (
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
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No leads available. Edit the form manually.
                                </div>
                            )}
                        </div>

                        {/* Company Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Company Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Company Name - company_name */}
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
                                        {clientTypes.map(type => (
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
                                        type="text"
                                        name="vat_number"
                                        value={formData.vat_number}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                                    />
                                </div>

                                {/* Client Since */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client Since
                                    </label>
                                    <input
                                        type="date"
                                        name="client_since"
                                        value={formData.client_since}
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
                                        City *
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
                                    />
                                    {errors.city && (
                                        <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Province *
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
                                    />
                                    {errors.province && (
                                        <p className="mt-1 text-sm text-red-600">{errors.province}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Country *
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
                                
                                {formData.logo_preview ? (
                                    <div className="relative">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                            <div className="flex items-center justify-center mb-3">
                                                <div className="relative">
                                                    <img 
                                                        src={formData.logo_preview} 
                                                        alt="Logo preview" 
                                                        className="w-32 h-32 object-contain rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveLogo}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                                                        title="Remove logo"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 text-center">
                                                Current logo - Click remove to delete
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <label className="cursor-pointer inline-block">
                                            <input
                                                type="file"
                                                name="logo"
                                                onChange={handleInputChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            <span className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                                                Upload new logo
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 2MB</p>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
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
                                    Updating...
                                </>
                            ) : (
                                'Update Client'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal;