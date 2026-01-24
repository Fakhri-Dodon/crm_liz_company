// resources/js/Components/ContactTable.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    User, Mail, Phone, Briefcase, Star,
    Search, Filter, Edit2, Trash2, Plus,
    Check, X, ChevronDown, ChevronUp, Grid, List
} from 'lucide-react';
import axios from 'axios';
import ContactModal from './ContactModal';
import { useTranslation } from 'react-i18next';
import SubModuleTableLayout, { ExpandableTextCell } from '@/Layouts/SubModuleTableLayout';

const ContactTable = ({ 
    contacts: initialData, 
    companyId,
    onUpdate,
    isLoading: propsLoading = false,
    auth_permissions
}) => {
    const { t } = useTranslation();
    const [data, setData] = useState(initialData || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' atau 'list'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState({});

    const perms = auth_permissions || {}; 
    const canCreate = perms.can_create === 1;
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    // Update data ketika initialData berubah
    useEffect(() => {
        setData(initialData || []);
    }, [initialData]);

    // Filter data
    const filterData = () => {
        return data
            .filter(contact => {
                const matchesSearch = searchTerm === '' || 
                    (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (contact.department && contact.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (contact.notes && contact.notes.toLowerCase().includes(searchTerm.toLowerCase()));
                
                const matchesStatus = statusFilter === 'all' ||
                    (statusFilter === 'primary' && contact.is_primary) ||
                    (statusFilter === 'secondary' && !contact.is_primary) ||
                    (statusFilter === 'active' && contact.is_active) ||
                    (statusFilter === 'inactive' && !contact.is_active);
                
                const matchesDepartment = departmentFilter === 'all' ||
                    (contact.department && contact.department.toLowerCase() === departmentFilter.toLowerCase());
                
                return matchesSearch && matchesStatus && matchesDepartment;
            })
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    };

    const filteredData = filterData();

    // Handle edit contact
    const handleEdit = (contact) => {
        setSelectedContact(contact);
        setIsEditModalOpen(true);
    };

    // Handle delete contact
    const handleDelete = async (contactId) => {
        if (!window.confirm(t('contact_table.confirm_delete'))) return;

        setLoading(true);
        try {
            await axios.delete(`/companies/${companyId}/contacts/${contactId}`);
            
            if (onUpdate) {
                onUpdate();
            }
            
            // Update local data
            setData(prev => prev.filter(item => item.id !== contactId));
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert(error.response?.data?.message || t('contact_table.delete_error'));
        } finally {
            setLoading(false);
        }
    };

    // Handle toggle primary
    const handleTogglePrimary = async (contactId) => {
        setLoading(true);
        try {
            await axios.post(`/companies/${companyId}/contacts/${contactId}/toggle-primary`);
            
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Error toggling primary:', error);
            alert(error.response?.data?.message || t('contact_table.toggle_primary_error'));
        } finally {
            setLoading(false);
        }
    };

    // Handle modal success
    const handleModalSuccess = (data, mode) => {
        if (onUpdate) {
            onUpdate();
        }
    };

    // Get status badge component
    const getStatusBadge = (contact) => {
        if (contact.is_primary) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    {t('contact_table.primary')}
                </span>
            );
        }
        
        if (contact.is_active === false) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <X className="w-3 h-3 mr-1" />
                    {t('contact_table.inactive')}
                </span>
            );
        }
        
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {t('contact_table.secondary')}
            </span>
        );
    };

    // Grid View Component
    const GridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.length === 0 ? (
                <div className="col-span-full bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? t('contact_table.empty_search_results') : t('contact_table.no_contacts_found')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {searchTerm ? t('contact_table.try_different_search') : t('contact_table.add_first_contact')}
                    </p>
                    {canCreate && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                            disabled={loading}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('contact_table.add_first_contact_button')}
                        </button>
                    )}
                </div>
            ) : (
                filteredData.map((contact) => (
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
                                {canUpdate && (
                                    <button 
                                        onClick={() => handleTogglePrimary(contact.id)}
                                        className={`p-1 rounded ${contact.is_primary 
                                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        title={contact.is_primary ? t('contact_table.primary_contact') : t('contact_table.set_as_primary')}
                                        disabled={loading}
                                    >
                                        <Star className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center">
                                <Mail className="w-3 h-3 text-gray-400 mr-2" />
                                <span className="text-xs text-gray-900 truncate">
                                    {contact.email || t('contact_table.no_email')}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-3 h-3 text-gray-400 mr-2" />
                                <span className="text-xs text-gray-900">
                                    {contact.phone || t('contact_table.no_phone')}
                                </span>
                            </div>
                            {contact.department && (
                                <div className="flex items-center">
                                    <Briefcase className="w-3 h-3 text-gray-400 mr-2" />
                                    <span className="text-xs text-gray-600">
                                        {contact.department}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {contact.notes && (
                            <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                <span className="font-medium">{t('contact_table.notes')}:</span>{" "}
                                <span className="line-clamp-2">{contact.notes}</span>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex space-x-1">
                                {getStatusBadge(contact)}
                            </div>
                            <div className="flex items-center space-x-1">
                                {canUpdate && (
                                    <button 
                                        onClick={() => handleEdit(contact)}
                                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                        title={t('contact_table.edit_contact')}
                                        disabled={loading}
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                )}
                                {canDelete && (
                                    <button 
                                        onClick={() => handleDelete(contact.id)}
                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                        title={t('contact_table.delete_contact')}
                                        disabled={loading}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    // Prepare columns untuk SubModuleTableLayout (List View)
    const columns = useMemo(() => [
        {
            key: 'name',
            label: t('contact_table.contact'),
            width: '150px',
            render: (value, row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        row.is_primary 
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                            : 'bg-gradient-to-br from-teal-500 to-teal-700'
                    }`}>
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-xs truncate">
                            {value || t('contact_table.no_name')}
                        </div>
                        <div className="text-gray-500 text-[10px] mt-0.5 truncate">
                            {row.position || t('contact_table.no_position')}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'department',
            label: t('contact_table.department'),
            width: '120px',
            render: (value) => (
                <div className="text-gray-600 text-xs truncate" title={value}>
                    {value || '-'}
                </div>
            )
        },
        {
            key: 'email',
            label: t('contact_table.email'),
            width: '140px',
            render: (value) => (
                <div className="text-gray-600 text-xs truncate" title={value}>
                    {value || t('contact_table.no_email')}
                </div>
            )
        },
        {
            key: 'phone',
            label: t('contact_table.phone'),
            width: '120px',
            render: (value) => (
                <div className="text-gray-600 text-xs">
                    {value || t('contact_table.no_phone')}
                </div>
            )
        },
        {
            key: 'status',
            label: t('contact_table.status'),
            width: '100px',
            render: (value, row) => getStatusBadge(row)
        },
        {
            key: 'notes',
            label: t('contact_table.notes'),
            width: '140px',
            render: (value) => (
                <ExpandableTextCell 
                    text={value || '-'}
                    maxLength={25}
                    className="text-gray-600 text-xs"
                />
            )
        }
    ], [t]);

    // Calculate statistics
    const totalContacts = data.length;
    const primaryCount = data.filter(c => c.is_primary).length;
    const activeCount = data.filter(c => c.is_active !== false).length;
    const inactiveCount = data.filter(c => c.is_active === false).length;

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('contact_table.no_contacts_found')}
                </h3>
                <p className="text-gray-600 mb-4">
                    {t('contact_table.add_first_contact')}
                </p>
                {canCreate && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                        disabled={loading}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('contact_table.add_first_contact_button')}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="font-bold text-gray-900 text-base">
                        {t('contact_table.contact_persons')}
                    </h2>
                    <p className="text-gray-600 text-xs">
                        {t('contact_table.contact_count', {
                            count: data.length,
                            filteredCount: filteredData.length
                        })}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded ${viewMode === 'grid' 
                                    ? 'bg-white text-teal-600 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'}`}
                                title={t('contact_table.grid_view')}
                                disabled={loading}
                            >
                                <Grid className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded ${viewMode === 'list' 
                                    ? 'bg-white text-teal-600 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'}`}
                                title={t('contact_table.list_view')}
                                disabled={loading}
                            >
                                <List className="w-3 h-3" />
                            </button>
                        </div>
                        
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <input
                                type="text"
                                placeholder={t('contact_table.search_contacts')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            disabled={loading}
                        >
                            <option value="all">{t('contact_table.all_status')}</option>
                            <option value="primary">{t('contact_table.primary_only')}</option>
                            <option value="secondary">{t('contact_table.secondary_only')}</option>
                            <option value="active">{t('contact_table.active')}</option>
                            <option value="inactive">{t('contact_table.inactive')}</option>
                        </select>

                        {canCreate && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="inline-flex items-center px-3 py-1.5 bg-teal-600 text-white rounded text-xs hover:bg-teal-700 transition-colors"
                                disabled={loading}
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                {t('contact_table.add_contact')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            {data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('contact_table.total_contacts')}
                        </div>
                        <div className="font-bold text-gray-900 text-sm">
                            {totalContacts}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('contact_table.primary_contacts')}
                        </div>
                        <div className="font-bold text-yellow-600 text-sm">
                            {primaryCount}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('contact_table.active_contacts')}
                        </div>
                        <div className="font-bold text-green-600 text-sm">
                            {activeCount}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('contact_table.inactive_contacts')}
                        </div>
                        <div className="font-bold text-red-600 text-sm">
                            {inactiveCount}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {viewMode === 'grid' ? (
                <GridView />
            ) : (
                <SubModuleTableLayout
                    columns={columns}
                    data={filteredData}
                    onEdit={canUpdate ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    showAction={canUpdate || canDelete}
                    tableTitle=""
                    showHeader={false}
                    showFooter={true}
                    compactMode={true}
                    rowHeight="h-11"
                />
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