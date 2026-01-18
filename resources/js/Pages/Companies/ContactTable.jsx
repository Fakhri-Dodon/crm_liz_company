// resources/js/Components/ContactTable.jsx
import React, { useState } from 'react';
import { 
    User, Mail, Phone, Briefcase, Star,
    MessageSquare, ChevronDown, ChevronUp,
    Edit2, Trash2, Plus, Check, X,
    Filter, Search, SortAsc, SortDesc
} from 'lucide-react';
import axios from 'axios';
import ContactModal from './ContactModal';
import { useTranslation } from 'react-i18next';

const ContactTable = ({ 
    contacts = [], 
    companyId,
    onUpdate,
    isLoading: propsLoading = false,
    auth_permissions
}) => {
    const { t } = useTranslation();
    const [expandedContact, setExpandedContact] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name_asc');

    const perms = auth_permissions || {}; 
    
    const canRead = perms.can_read === 1;
    const canCreate = perms.can_create === 1;
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    const isLoading = propsLoading || internalLoading;

    // Filter and sort contacts
    const filteredAndSortedContacts = contacts
        .filter(contact => {
            const matchesSearch = !searchTerm || 
                (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (contact.department && contact.department.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'primary' && contact.is_primary) ||
                (statusFilter === 'secondary' && !contact.is_primary) ||
                (statusFilter === 'active' && contact.is_active) ||
                (statusFilter === 'inactive' && !contact.is_active);
            
            const matchesDepartment = departmentFilter === 'all' ||
                (contact.department && contact.department.toLowerCase() === departmentFilter.toLowerCase());
            
            return matchesSearch && matchesStatus && matchesDepartment;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name_asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name_desc':
                    return (b.name || '').localeCompare(a.name || '');
                case 'date_asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'date_desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'position':
                    return (a.position || '').localeCompare(b.position || '');
                default:
                    return 0;
            }
        });

    const toggleContact = (id) => {
        setExpandedContact(expandedContact === id ? null : id);
    };

    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    const handleEdit = (contact) => {
        console.log('Editing contact:', contact);
        setSelectedContact(contact);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (contactId) => {
        if (!confirm(t('contact_table.confirm_delete'))) {
            return;
        }

        setInternalLoading(true);
        try {
            console.log('Deleting contact:', contactId);
            const response = await axios.delete(`/companies/${companyId}/contacts/${contactId}`);
            console.log('Delete response:', response.data);
            
            if (response.data.success) {
                if (onUpdate) {
                    onUpdate();
                }
                showSuccessMessage(t('contact_table.contact_deleted_success'));
            } else {
                throw new Error(response.data.message || t('contact_table.delete_failed'));
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert(error.response?.data?.message || t('contact_table.delete_error'));
        } finally {
            setInternalLoading(false);
        }
    };

    const handleTogglePrimary = async (contactId) => {
        setInternalLoading(true);
        try {
            console.log('Toggling primary for contact:', contactId);
            const response = await axios.post(`/companies/${companyId}/contacts/${contactId}/toggle-primary`);
            console.log('Toggle primary response:', response.data);
            
            if (response.data.success) {
                if (onUpdate) {
                    onUpdate();
                }
                showSuccessMessage(t('contact_table.primary_contact_updated'));
            } else {
                throw new Error(response.data.message || t('contact_table.toggle_primary_failed'));
            }
        } catch (error) {
            console.error('Error toggling primary:', error);
            alert(error.response?.data?.message || t('contact_table.toggle_primary_error'));
        } finally {
            setInternalLoading(false);
        }
    };

    const handleModalSuccess = (data, mode) => {
        console.log('Modal success:', mode, data);
        if (onUpdate) {
            onUpdate();
        }
        showSuccessMessage(t(mode === 'edit' ? 'contact_table.contact_updated_success' : 'contact_table.contact_added_success'));
    };

    // Mobile List View
    const MobileListView = () => (
        <div className="space-y-3">
            {filteredAndSortedContacts.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                            ? t('contact_table.empty_search_results')
                            : t('contact_table.no_contacts_found')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                            ? t('contact_table.try_different_search')
                            : t('contact_table.add_first_contact')}
                    </p>
                    {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDepartmentFilter('all');
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {t('contact_table.clear_search_filters')}
                        </button>
                    ) : (
                        canCreate && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                disabled={isLoading}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('contact_table.add_first_contact_button')}
                            </button>
                        )                       
                    )}
                </div>
            ) : (
                filteredAndSortedContacts.map((contact) => (
                    <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    contact.is_primary 
                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                                        : 'bg-gradient-to-br from-teal-500 to-teal-700'
                                }`}>
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">
                                        {contact.name}
                                        {contact.is_primary && (
                                            <Star className="w-3 h-3 text-yellow-500 inline-block ml-1" />
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-600">
                                        {contact.position || t('contact_table.no_position')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button 
                                    onClick={() => {if (canUpdate) handleTogglePrimary(contact.id);}}
                                    className={`p-1.5 rounded-lg ${contact.is_primary 
                                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    title={contact.is_primary ? t('contact_table.primary_contact') : t('contact_table.set_as_primary')}
                                    disabled={isLoading}
                                >
                                    <Star className="w-4 h-4" />
                                </button>
                                {canUpdate && (
                                    <button 
                                        onClick={() => handleEdit(contact)}
                                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                        title={t('contact_table.edit_contact')}
                                        disabled={isLoading}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* 3. DELETE BUTTON (Hanya jika canDelete) */}
                                {canDelete && (
                                    <button 
                                        onClick={() => handleDelete(contact.id)}
                                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                        title={t('contact_table.delete_contact')}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-xs text-gray-900 truncate">
                                    {contact.email || t('contact_table.no_email')}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-xs text-gray-900">
                                    {contact.phone || t('contact_table.no_phone')}
                                </span>
                            </div>
                            {contact.department && (
                                <div className="flex items-center">
                                    <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-xs text-gray-600">
                                        {contact.department}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex space-x-2">
                                {contact.is_primary && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <Check className="w-3 h-3 mr-1" />
                                        {t('contact_table.primary')}
                                    </span>
                                )}
                                {contact.is_active === false && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <X className="w-3 h-3 mr-1" />
                                        {t('contact_table.inactive')}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => toggleContact(contact.id)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label={expandedContact === contact.id ? t('contact_table.close_details') : t('contact_table.open_details')}
                            >
                                {expandedContact === contact.id ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        {expandedContact === contact.id && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="space-y-3">
                                    {contact.notes && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">{t('contact_table.notes')}</p>
                                            <p className="text-sm text-gray-700">{contact.notes}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">{t('contact_table.created_at')}</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">{t('contact_table.last_contacted')}</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : t('contact_table.never_contacted')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    // Desktop Grid View
    const DesktopGridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedContacts.length === 0 ? (
                <div className="col-span-full bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                            ? t('contact_table.empty_search_results')
                            : t('contact_table.no_contacts_yet')}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                            ? t('contact_table.try_different_search')
                            : t('contact_table.add_contacts_description')}
                    </p>
                    {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDepartmentFilter('all');
                            }}
                            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            {t('contact_table.clear_search_filters')}
                        </button>
                    ) : (
                        canCreate && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                                disabled={isLoading}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                {t('contact_table.add_first_contact_button_long')}
                            </button>
                        )                                                            
                    )}
                </div>
            ) : (
                filteredAndSortedContacts.map((contact) => (
                    <div key={contact.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                                    contact.is_primary 
                                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                                        : 'bg-gradient-to-br from-teal-500 to-teal-700'
                                }`}>
                                    <User className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {contact.name}
                                        {contact.is_primary && (
                                            <Star className="w-4 h-4 text-yellow-500 inline-block ml-2" />
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600 truncate max-w-[150px]">
                                        {contact.position || t('contact_table.no_position_specified')}
                                    </p>
                                    {contact.department && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {contact.department}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                { canUpdate && (
                                    <>
                                        <button 
                                            onClick={() => handleTogglePrimary(contact.id)}
                                            className={`p-1.5 rounded-lg ${contact.is_primary 
                                                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                            title={contact.is_primary ? t('contact_table.primary_contact') : t('contact_table.set_as_primary')}
                                            disabled={isLoading}
                                        >
                                            <Star className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(contact)}
                                            className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                            title={t('contact_table.edit_contact')}
                                            disabled={isLoading}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </>                                    
                                )} 
                                { canDelete && (
                                    <button 
                                        onClick={() => handleDelete(contact.id)}
                                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                        title={t('contact_table.delete_contact')}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}                                                                               
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 mb-1">
                                        {t('contact_table.email_label')}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {contact.email || t('contact_table.no_email_provided')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">
                                        {t('contact_table.phone_label')}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {contact.phone || t('contact_table.no_phone_provided')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {contact.notes && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-2">{t('contact_table.notes')}</p>
                                <p className="text-sm text-gray-700 line-clamp-3">{contact.notes}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex space-x-2">
                                {contact.is_primary && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <Check className="w-3 h-3 mr-1" />
                                        {t('contact_table.primary_contact_label')}
                                    </span>
                                )}
                                {contact.is_active === false && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <X className="w-3 h-3 mr-1" />
                                        {t('contact_table.inactive_label')}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {contact.created_at && (
                                    <span>{t('contact_table.created_at')}: {new Date(contact.created_at).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // Desktop Table View
    const DesktopTableView = () => (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {filteredAndSortedContacts.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                            ? t('contact_table.empty_search_results')
                            : t('contact_table.no_contacts_available')}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
                            ? t('contact_table.try_different_search')
                            : t('contact_table.add_contacts_description_short')}
                    </p>
                    {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' ? (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDepartmentFilter('all');
                            }}
                            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            {t('contact_table.clear_search_filters')}
                        </button>
                    ) : (
                        canCreate && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                                disabled={isLoading}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                {t('contact_table.add_first_contact_button')}
                            </button>
                        )                        
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {t('contact_table.contact')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {t('contact_table.position')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {t('contact_table.email')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {t('contact_table.phone')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {t('contact_table.status')}
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    {t('contact_table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredAndSortedContacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                contact.is_primary 
                                                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                                                    : 'bg-gradient-to-br from-teal-500 to-teal-700'
                                            }`}>
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {contact.name}
                                                    {contact.is_primary && (
                                                        <Star className="w-3 h-3 text-yellow-500 inline-block ml-1" />
                                                    )}
                                                </div>
                                                {contact.department && (
                                                    <div className="text-xs text-gray-500">
                                                        {contact.department}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {contact.position || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 truncate max-w-xs">
                                            {contact.email || t('contact_table.no_email')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {contact.phone || t('contact_table.no_phone')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-2">
                                            {contact.is_primary ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    {t('contact_table.primary')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {t('contact_table.secondary')}
                                                </span>
                                            )}
                                            {contact.is_active === false && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <X className="w-3 h-3 mr-1" />
                                                    {t('contact_table.inactive')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            { canUpdate && (
                                                <>
                                                    <button 
                                                        onClick={() => handleTogglePrimary(contact.id)}
                                                        className={`p-1.5 rounded-lg ${contact.is_primary 
                                                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                        title={contact.is_primary ? t('contact_table.primary_contact') : t('contact_table.set_as_primary')}
                                                        disabled={isLoading}
                                                    >
                                                        <Star className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(contact)}
                                                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                                        title={t('contact_table.edit_contact')}
                                                        disabled={isLoading}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}           
                                            { canDelete && (
                                                <button 
                                                    onClick={() => handleDelete(contact.id)}
                                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                    title={t('contact_table.delete_contact')}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}                                                                            
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative">
            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 animate-fade-in-down">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <button
                                    onClick={() => setSuccessMessage('')}
                                    className="text-green-600 hover:text-green-800"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('contact_table.contact_persons')}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {t('contact_table.manage_contacts_description')}
                    </p>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('contact_table.search_contacts')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-48 sm:w-64"
                            disabled={isLoading}
                        />
                    </div>
                    
                    {/* View Toggle */}
                    {filteredAndSortedContacts.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'grid' 
                                        ? 'bg-white text-teal-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'}`}
                                    disabled={isLoading}
                                >
                                    {t('contact_table.grid_view')}
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'list' 
                                        ? 'bg-white text-teal-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'}`}
                                    disabled={isLoading}
                                >
                                    {t('contact_table.list_view')}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Add Button */}
                    { canCreate && (
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>{t('contact_table.adding')}</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    <span>{t('contact_table.add_contact')}</span>
                                </>
                            )}
                        </button>
                    )}                    
                </div>
            </div>

            {/* Filters */}
            {contacts.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        disabled={isLoading}
                    >
                        <option value="all">{t('contact_table.all_status')}</option>
                        <option value="primary">{t('contact_table.primary_only')}</option>
                        <option value="secondary">{t('contact_table.secondary_only')}</option>
                        <option value="active">{t('contact_table.active')}</option>
                        <option value="inactive">{t('contact_table.inactive')}</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        disabled={isLoading}
                    >
                        <option value="name_asc">{t('contact_table.sort_name_asc')}</option>
                        <option value="name_desc">{t('contact_table.sort_name_desc')}</option>
                        <option value="date_asc">{t('contact_table.sort_date_asc')}</option>
                        <option value="date_desc">{t('contact_table.sort_date_desc')}</option>
                        <option value="position">{t('contact_table.sort_position')}</option>
                    </select>

                    {(searchTerm || statusFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDepartmentFilter('all');
                            }}
                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center"
                        >
                            <X className="w-4 h-4 mr-1" />
                            {t('contact_table.clear_filters')}
                        </button>
                    )}
                </div>
            )}

            {/* Loading State */}
            {propsLoading && contacts.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-teal-600 mb-4"></div>
                    <span className="text-gray-600">
                        {t('contact_table.loading_contacts')}
                    </span>
                </div>
            ) : (
                <>
                    {/* Mobile View */}
                    <div className="sm:hidden">
                        <MobileListView />
                    </div>

                    {/* Desktop View */}
                    <div className="hidden sm:block">
                        {viewMode === 'grid' ? <DesktopGridView /> : <DesktopTableView />}
                    </div>

                    {/* Summary Stats */}
                    {contacts.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {t('contact_table.contact_statistics')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-xl">
                                    <p className="text-sm font-medium text-blue-700 mb-2">
                                        {t('contact_table.total_contacts')}
                                    </p>
                                    <p className="text-3xl font-bold text-blue-900">{contacts.length}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-5 rounded-xl">
                                    <p className="text-sm font-medium text-green-700 mb-2">
                                        {t('contact_table.primary_contacts')}
                                    </p>
                                    <p className="text-3xl font-bold text-green-900">
                                        {contacts.filter(c => c.is_primary).length}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-5 rounded-xl">
                                    <p className="text-sm font-medium text-purple-700 mb-2">
                                        {t('contact_table.active_contacts')}
                                    </p>
                                    <p className="text-3xl font-bold text-purple-900">
                                        {contacts.filter(c => c.is_active !== false).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <ContactModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                companyId={companyId}
                mode="add"
                onSuccess={handleModalSuccess}
            />

            <ContactModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                companyId={companyId}
                contact={selectedContact}
                mode="edit"
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default ContactTable;