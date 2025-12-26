import React, { useState, useEffect } from 'react';
import { X, Upload, Building, User, Mail, Phone, MapPin, Globe, FileText, AlertCircle, Check, Image, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const EditModal = ({ isOpen, onClose, company, clientTypes, onUpdate }) => {
    // **UPDATE**: Field name hanya yang ada di table companies
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
        logo_preview: '',
        delete_logo: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [leadContactInfo, setLeadContactInfo] = useState(null);

    // Setup axios defaults
    useEffect(() => {
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.withCredentials = true;
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
    }, []);

    // Initialize form data when company changes
    useEffect(() => {
        if (isOpen && company && clientTypes.length > 0) {
            console.log('=== INITIALIZING EDIT FORM ===');
            console.log('Company data:', company);
            console.log('Client types available:', clientTypes);
            
            // Cari client type yang sesuai dengan company
            const matchingClientType = clientTypes.find(type => type.id === company.client_type_id);
            console.log('Matching client type:', matchingClientType);
            
            // **PERBAIKAN**: Pastikan semua field required ada value
            const initialData = {
                company_name: company.client_code || company.name || 'Untitled Company',
                client_type_id: company.client_type_id || (clientTypes.length > 0 ? clientTypes[0].id : ''),
                status: company.is_active ? 'active' : 'inactive',
                city: company.city || '',
                province: company.province || '',
                country: company.country || '',
                postal_code: company.postal_code?.toString() || '',
                vat_number: company.vat_number?.toString() || '',
                nib: company.nib || '',
                website: company.website || '',
                logo: null,
                logo_preview: company.logo_url || '',
                delete_logo: false
            };
            
            console.log('Initial form data:', initialData);
            
            setFormData(initialData);
            setLogoFile(null);
            setErrors({});
            
            // Reset lead contact info
            setLeadContactInfo(null);
            setSelectedLead(null);
        }
    }, [isOpen, company, clientTypes]);
    // Fetch lead contact info jika ada
    const fetchLeadContactInfo = async (leadId) => {
        try {
            const response = await axios.get(`/leads/${leadId}`);
            if (response.data.success) {
                setLeadContactInfo(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching lead contact info:', error);
        }
    };

    // Fetch leads (optional)
    const fetchLeads = async () => {
        setLoadingLeads(true);
        try {
            const response = await axios.get('/companies/get-leads');
            if (response.data.success) {
                setLeads(response.data.data || []);
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
        }));
        setLeadContactInfo(lead);
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
        // **PERBAIKAN RADIKAL**: Gunakan JSON untuk update tanpa file upload
        const requestData = {
            company_name: formData.company_name || '',
            client_type_id: formData.client_type_id || '',
            status: formData.status || 'active',
            city: formData.city || '',
            province: formData.province || '',
            country: formData.country || '',
            postal_code: formData.postal_code ? parseInt(formData.postal_code) || null : null,
            vat_number: formData.vat_number ? parseInt(formData.vat_number) || null : null,
            nib: formData.nib || '',
            website: formData.website || '',
            // Note: Logo tidak bisa diupdate via JSON, perlu endpoint terpisah
        };

        console.log('=== SENDING JSON DATA ===');
        console.log('Request data:', requestData);
        console.log('URL:', `/companies/${company.id}`);

        // **PERBAIKAN**: Gunakan POST dengan _method=PUT atau langsung PUT dengan JSON
        const response = await axios.put(`/companies/${company.id}`, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        console.log('Server response:', response.data);

        if (response.data.success) {
            alert(response.data.message || 'Client updated successfully!');
            
            // Clean up blob URL if exists
            if (formData.logo_preview && formData.logo_preview.startsWith('blob:')) {
                URL.revokeObjectURL(formData.logo_preview);
            }
            
            // Call onUpdate callback
            if (onUpdate) {
                onUpdate(response.data.data || company.id);
            }
            
            // Refresh data
            router.reload({
                only: ['companies', 'statistics'],
                preserveScroll: true,
            });
            
            onClose();
        } else {
            console.error('Update failed:', response.data);
            setErrors(response.data.errors || {});
            alert(response.data.message || 'Failed to update client');
        }
    } catch (error) {
        console.error('Error updating client:', error);
        console.error('Error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response?.status === 422) {
            const validationErrors = error.response.data.errors || {};
            setErrors(validationErrors);
            
            console.log('Validation errors:', validationErrors);
            
            // Format validation errors
            const errorMessages = Object.entries(validationErrors)
                .map(([field, messages]) => {
                    if (Array.isArray(messages)) {
                        return `${field}: ${messages.join(', ')}`;
                    }
                    return `${field}: ${messages}`;
                });
            
            if (errorMessages.length > 0) {
                alert(`Validation errors:\n${errorMessages.join('\n')}`);
            } else {
                alert('Please check the form for errors.');
            }
        } else {
            const errorMsg = error.response?.data?.message || error.message || 'An error occurred';
            setErrors(prev => ({ ...prev, submit: errorMsg }));
            alert(`Error updating client: ${errorMsg}`);
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
                            Editing: <span className="font-medium">{company.client_code}</span>
                            {company.id && (
                                <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                                    ID: {company.id.substring(0, 8)}...
                                </span>
                            )}
                        </p>
                        {leadContactInfo && (
                            <p className="text-sm text-blue-600 mt-1">
                                ✓ Data kontak diambil dari lead
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form - UPDATE sesuai Create form */}
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

                        {/* Contact Info from Lead (Display only) */}
                        {leadContactInfo && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Contact Information (From Lead)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Contact Person
                                        </label>
                                        <div className="text-sm text-gray-800">
                                            {leadContactInfo.contact_person || 'Not specified'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Email
                                        </label>
                                        <div className="text-sm text-gray-800 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {leadContactInfo.email || 'Not specified'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Phone
                                        </label>
                                        <div className="text-sm text-gray-800 flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {leadContactInfo.phone || 'Not specified'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Address
                                        </label>
                                        <div className="text-sm text-gray-800">
                                            {leadContactInfo.address || 'Not specified'}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600 mt-2">
                                    ℹ️ Contact information is stored in the lead table and cannot be edited here.
                                </p>
                            </div>
                        )}

                        {/* Lead Selection (Optional) */}
                        {!company.lead_id && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Associate with Lead (Optional)
                                </h3>
                                <button
                                    type="button"
                                    onClick={fetchLeads}
                                    className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                                >
                                    {loadingLeads ? 'Loading leads...' : 'Click to load available leads'}
                                </button>
                                {leads.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {leads.map(lead => (
                                            <div
                                                key={lead.id}
                                                onClick={() => handleLeadSelect(lead)}
                                                className={`p-3 border rounded-lg cursor-pointer transition ${
                                                    selectedLead?.id === lead.id
                                                        ? 'border-yellow-500 bg-yellow-100'
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
                                                        <Check className="w-5 h-5 text-yellow-600" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
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
                                    <p className="text-xs text-gray-500 mt-1">
                                        Stored as client code
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
                                    >
                                        <option value="">Select Type</option>
                                        {clientTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.name} - {type.information}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.client_type_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.client_type_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Location Info */}
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

                        {/* Info about contact data */}
                        {!company.lead_id && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">Contact Information Note</p>
                                        <p className="text-sm text-yellow-600 mt-1">
                                            This client is not associated with a lead. To add contact information, 
                                            please create or associate a lead first.
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