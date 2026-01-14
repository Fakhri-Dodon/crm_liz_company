// resources/js/Components/Companies/EditModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Upload, Building, User, Mail, Phone, MapPin, 
    Globe, FileText, AlertCircle, Check, Image, Trash2,
    Briefcase, Smartphone, AtSign, Globe as GlobeIcon,
    Lock
} from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const EditModal = ({ isOpen, onClose, company, clientTypes, onUpdate }) => {
    const { t } = useTranslation();
    
    // State untuk menyimpan data form
    const [formData, setFormData] = useState({
        // Company fields - company_name akan diambil dari leads (READ ONLY)
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
        logo_preview: '',
        delete_logo: false,
        
        // Contact Person fields
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        contact_position: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [contactLoading, setContactLoading] = useState(false);
    const [hasContactData, setHasContactData] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const isInitializing = useRef(false);

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
        const initializeFormData = async () => {
            if (!isOpen || !company || clientTypes.length === 0 || isInitializing.current) {
                return;
            }

            isInitializing.current = true;
            setIsInitialized(false);
            console.log('=== EDIT MODAL INITIALIZATION ===');
            console.log('Full company data received:', company);
            console.log('Lead data:', company.lead);
            console.log('Primary contact:', company.primary_contact);
            console.log('Client Types available:', clientTypes);

            try {
                // Ambil company_name dari berbagai sumber dengan prioritas
                const companyName = company.company_name || 
                                   company.lead?.company_name || 
                                   company.client_code || 
                                   company.name || 
                                   '';

                // Ambil data kontak dari berbagai sumber dengan prioritas
                const contactData = {
                    contact_person: company.contact_person || 
                                  company.primary_contact?.name || 
                                  company.lead?.contact_person || 
                                  '',
                    contact_email: company.contact_email || 
                                 company.email || 
                                 company.primary_contact?.email || 
                                 company.lead?.email || 
                                 '',
                    contact_phone: company.contact_phone || 
                                 company.phone || 
                                 company.primary_contact?.phone || 
                                 company.lead?.phone || 
                                 '',
                    contact_position: company.contact_position || 
                                    company.primary_contact?.position || 
                                    company.lead?.position || 
                                    ''
                };

                console.log('Company Name resolved:', {
                    fromProp: company.company_name,
                    fromLead: company.lead?.company_name,
                    fromClientCode: company.client_code,
                    fromName: company.name,
                    finalValue: companyName
                });

                console.log('Contact data resolved:', contactData);

                // Data untuk form
                const companyData = {
                    // Company Name dari leads (READ ONLY)
                    company_name: companyName,
                    
                    // Client type
                    client_type_id: company.client_type_id || (clientTypes.length > 0 ? clientTypes[0].id : ''),
                    
                    // Status
                    status: company.is_active ? 'active' : 'inactive',
                    
                    // Location info
                    city: company.city || '',
                    province: company.province || '',
                    country: company.country || '',
                    postal_code: company.postal_code?.toString() || '',
                    
                    // Business details
                    vat_number: company.vat_number?.toString() || '',
                    nib: company.nib || '',
                    website: company.website || '',
                    
                    // Logo
                    logo: null,
                    logo_preview: company.logo_url || '',
                    delete_logo: false,
                    
                    // Contact fields
                    contact_person: contactData.contact_person,
                    contact_email: contactData.contact_email,
                    contact_phone: contactData.contact_phone,
                    contact_position: contactData.contact_position
                };

                console.log('Form data to be set:', companyData);

                // Set form data
                setFormData(companyData);
                
                // Check if we have contact data
                const hasContactInfo = contactData.contact_person || 
                                      contactData.contact_email || 
                                      contactData.contact_phone;
                setHasContactData(!!hasContactInfo);

                // Jika tidak ada data kontak, coba fetch dari API
                if (!hasContactInfo && company.id) {
                    await loadContactPersonData(company.id, companyData);
                }

                console.log('=== FORM INITIALIZED SUCCESSFULLY ===');

            } catch (error) {
                console.error('Error during form initialization:', error);
            } finally {
                setIsInitialized(true);
                isInitializing.current = false;
            }
        };

        initializeFormData();

        // Cleanup function untuk blob URLs
        return () => {
            if (formData.logo_preview && formData.logo_preview.startsWith('blob:')) {
                URL.revokeObjectURL(formData.logo_preview);
            }
        };
    }, [isOpen, company, clientTypes]);

    // Fungsi untuk load contact person data dari API
    const loadContactPersonData = async (companyId, currentFormData) => {
        setContactLoading(true);
        try {
            console.log('Fetching contact data from API for company:', companyId);
            
            const response = await axios.get(`/api/companies/${companyId}/primary-contact`);
            
            if (response.data.success && response.data.data) {
                const contactData = response.data.data;
                console.log('Contact API data received:', contactData);
                
                setFormData(prev => ({
                    ...prev,
                    contact_person: contactData.name || '',
                    contact_email: contactData.email || '',
                    contact_phone: contactData.phone || '',
                    contact_position: contactData.position || ''
                }));
                
                setHasContactData(true);
            } else {
                console.log('No contact data from API');
                setHasContactData(false);
            }
        } catch (error) {
            console.error('Error fetching contact data:', error);
            setHasContactData(false);
        } finally {
            setContactLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        // Skip if trying to change company_name (read-only)
        if (name === 'company_name') {
            console.log('Company name is read-only, ignoring change attempt');
            return;
        }
        
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
            // Prepare data untuk update
            const requestData = {
                // Company Name (read-only, hanya untuk validasi)
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
                
                // Contact person data
                contact_person: formData.contact_person || '',
                contact_email: formData.contact_email || '',
                contact_phone: formData.contact_phone || '',
                contact_position: formData.contact_position || '',
                
                // Logo deletion
                delete_logo: formData.delete_logo ? '1' : '0'
            };

            console.log('=== SUBMITTING UPDATE DATA ===');
            console.log('Company ID:', company.id);
            console.log('Company Name (read-only, for validation):', requestData.company_name);
            console.log('Client Code (will remain unchanged):', company.client_code);
            console.log('Full request data:', requestData);

            // Create FormData untuk handle file upload
            const formDataToSend = new FormData();
            
            // Append semua field
            Object.keys(requestData).forEach(key => {
                if (requestData[key] !== null && requestData[key] !== undefined) {
                    formDataToSend.append(key, requestData[key]);
                }
            });
            
            // Append logo file jika ada
            if (formData.logo) {
                formDataToSend.append('logo', formData.logo);
                console.log('Logo file appended:', formData.logo.name);
            }

            // Kirim request ke server
            const response = await axios.post(`/companies/${company.id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
                params: {
                    '_method': 'PUT'
                }
            });

            console.log('Server response:', response.data);

            if (response.data.success) {
                alert(response.data.message || t('companies_edit.client_updated_successfully'));
                
                // Clean up blob URL jika ada
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
                alert(response.data.message || t('companies_edit.failed_to_update_client'));
            }
        } catch (error) {
            console.error('Error updating client:', error);
            
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors || {};
                setErrors(validationErrors);
                
                console.log('Validation errors:', validationErrors);
                
                const errorMessages = Object.entries(validationErrors)
                    .map(([field, messages]) => {
                        if (Array.isArray(messages)) {
                            return `${field}: ${messages.join(', ')}`;
                        }
                        return `${field}: ${messages}`;
                    });
                
                if (errorMessages.length > 0) {
                    alert(`${t('companies_edit.validation_errors')}:\n${errorMessages.join('\n')}`);
                } else {
                    alert(t('companies_edit.check_form_errors'));
                }
            } else {
                const errorMsg = error.response?.data?.message || error.message || t('companies_edit.error_occurred');
                setErrors(prev => ({ ...prev, submit: errorMsg }));
                alert(`${t('companies_edit.error_updating_client')}: ${errorMsg}`);
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

    if (!isOpen || !company || !isInitialized) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {t('companies_edit.title')}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-gray-600">
                                {t('companies_edit.editing')}: <span className="font-medium">{company.client_code}</span>
                            </p>
                            {company.id && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                                    ID: {company.id}
                                </span>
                            )}
                        </div>
                        <div className="mt-1 text-sm">
                            <span className="text-gray-700 font-medium">Company Name: </span>
                            <span className="text-blue-600 font-semibold">
                                {formData.company_name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                                (Read Only - from Leads)
                            </span>
                        </div>
                        {contactLoading ? (
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                {t('companies_edit.loading_contact_data')}
                            </p>
                        ) : hasContactData ? (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {t('companies_edit.contact_data_loaded')}
                            </p>
                        ) : (
                            <p className="text-sm text-yellow-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {t('companies_edit.no_contact_data')}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        disabled={isSubmitting}
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-180px)]">
                    <div className="p-6 space-y-8">
                        {/* Section 1: Contact Person Information */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                {t('companies_edit.contact_person_information')}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Person Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-500" />
                                        {t('companies_edit.contact_person_name')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                            errors.contact_person ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                        }`}
                                        placeholder={t('companies_edit.contact_person_placeholder')}
                                        required
                                    />
                                    {errors.contact_person && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.contact_person}
                                        </p>
                                    )}
                                </div>

                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-blue-500" />
                                        {t('companies_edit.position')} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="contact_position"
                                        value={formData.contact_position}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        placeholder={t('companies_edit.position_placeholder')}
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-blue-500" />
                                        {t('companies_edit.email_address')} *
                                    </label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={formData.contact_email}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                            errors.contact_email ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                        }`}
                                        placeholder={t('companies_edit.email_placeholder')}
                                        required
                                    />
                                    {errors.contact_email && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.contact_email}
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-blue-500" />
                                        {t('companies_edit.phone_number')} *
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                            errors.contact_phone ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                        }`}
                                        placeholder={t('companies_edit.phone_placeholder')}
                                        required
                                    />
                                    {errors.contact_phone && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.contact_phone}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                        <Smartphone className="w-3 h-3" />
                                        {t('companies_edit.phone_format')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Company Information */}
                        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-teal-900 mb-4 flex items-center gap-3">
                                <div className="p-2 bg-teal-100 rounded-lg">
                                    <Building className="w-6 h-6 text-teal-600" />
                                </div>
                                {t('companies_edit.company_information')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Company Name - READ ONLY */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Building className="w-4 h-4 text-teal-500" />
                                        {t('companies_edit.company_name')} <span className="text-red-600">*</span>
                                        <span className="ml-2 text-xs text-blue-600 font-normal bg-blue-50 px-2 py-0.5 rounded">
                                            Read Only
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <div className="w-full px-4 py-3 border border-teal-200 rounded-lg bg-gray-50 text-gray-800 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="font-medium">{formData.company_name}</div>
                                            </div>
                                            <div className="flex items-center text-gray-500">
                                                <Lock className="w-4 h-4 mr-1" />
                                                <span className="text-xs">Locked</span>
                                            </div>
                                        </div>
                                        {/* Hidden input untuk tetap mengirim data ke server */}
                                        <input
                                            type="hidden"
                                            name="company_name"
                                            value={formData.company_name}
                                            required
                                        />
                                    </div>
                                    <div className="mt-2 flex items-start text-xs text-gray-500">
                                        <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                        <span>
                                            Company name is retrieved from the associated Lead record and cannot be edited here. 
                                            To change the company name, please update the corresponding Lead in the Leads section.
                                        </span>
                                    </div>
                                </div>

                                {/* Client Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('companies_edit.client_type')} <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        name="client_type_id"
                                        value={formData.client_type_id}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition ${
                                            errors.client_type_id ? 'border-red-300 bg-red-50' : 'border-teal-200'
                                        }`}
                                        required
                                    >
                                        <option value="">{t('companies_edit.select_client_type')}</option>
                                        {clientTypes.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.name} {type.information ? `- ${type.information}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.client_type_id && (
                                        <p className="mt-2 text-sm text-red-600">{errors.client_type_id}</p>
                                    )}
                                </div>

                                {/* Location Info */}
                                <div className="md:col-span-2">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-teal-600" />
                                        {t('companies_edit.location_information')}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('companies_edit.city')} <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder={t('companies_edit.city_placeholder')}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('companies_edit.province')} <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="province"
                                                value={formData.province}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder={t('companies_edit.province_placeholder')}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('companies_edit.country')} <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder={t('companies_edit.country_placeholder')}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Business Details */}
                                <div className="md:col-span-2">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-teal-600" />
                                        {t('companies_edit.business_details')}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('companies_edit.postal_code')} <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="postal_code"
                                                value={formData.postal_code}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder={t('companies_edit.postal_code_placeholder')}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('companies_edit.vat_number')} <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="vat_number"
                                                value={formData.vat_number}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder={t('companies_edit.vat_number_placeholder')}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('companies_edit.nib_number')} <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="nib"
                                                value={formData.nib}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder={t('companies_edit.nib_placeholder')}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('companies_edit.website')} <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="url"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                placeholder={t('companies_edit.website_placeholder')}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Status & Logo */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Status */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {t('companies_edit.status')}
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                                        formData.status === 'active' 
                                            ? 'border-green-500 bg-green-50' 
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="active"
                                            checked={formData.status === 'active'}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-green-600 focus:ring-green-500"
                                        />
                                        <div className="ml-3">
                                            <span className="font-medium text-gray-900">
                                                {t('companies_edit.active')}
                                            </span>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {t('companies_edit.active_description')}
                                            </p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                                        formData.status === 'inactive' 
                                            ? 'border-gray-500 bg-gray-50' 
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="inactive"
                                            checked={formData.status === 'inactive'}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-gray-600 focus:ring-gray-500"
                                        />
                                        <div className="ml-3">
                                            <span className="font-medium text-gray-900">
                                                {t('companies_edit.inactive')}
                                            </span>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {t('companies_edit.inactive_description')}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Logo */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {t('companies_edit.company_logo')}
                                </h3>
                                
                                {formData.logo_preview ? (
                                    <div className="relative">
                                        <div className="border-2 border-dashed border-teal-300 rounded-xl p-4 bg-gradient-to-br from-teal-50 to-white">
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-4">
                                                    <img 
                                                        src={formData.logo_preview} 
                                                        alt={t('companies_edit.logo_preview')}
                                                        className="w-40 h-40 object-contain rounded-xl shadow-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveLogo}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                                                        title={t('companies_edit.remove_logo')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-500 text-center">
                                                    {t('companies_edit.current_logo')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-teal-300 rounded-xl p-6 text-center bg-gradient-to-br from-teal-50 to-white hover:border-teal-400 transition cursor-pointer">
                                        <input
                                            type="file"
                                            id="logo-upload"
                                            name="logo"
                                            onChange={handleInputChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <label htmlFor="logo-upload" className="cursor-pointer">
                                            <Upload className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                                            <div className="font-medium text-teal-700 hover:text-teal-800">
                                                {t('companies_edit.upload_new_logo')}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {t('companies_edit.file_requirements')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {t('companies_edit.recommended_size')}
                                            </p>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">
                                {t('companies_edit.editing_client')}: <span className="font-semibold">{company.client_code}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500">
                                    Company Name: <span className="font-medium text-blue-600">{formData.company_name}</span>
                                </p>
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    Read Only
                                </span>
                            </div>
                            {contactLoading && (
                                <p className="text-xs text-blue-600 mt-1">
                                    {t('companies_edit.loading_contact_information')}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50 hover:bg-gray-200 rounded-lg transition"
                            >
                                {t('companies_edit.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {t('companies_edit.updating')}
                                    </>
                                ) : (
                                    t('companies_edit.update_client_contact')
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal;