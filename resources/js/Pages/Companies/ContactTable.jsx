// resources/js/Components/ContactTable.jsx
import React, { useState } from 'react';
import { 
    User, Mail, Phone, Briefcase, Star,
    MessageSquare, ChevronDown, ChevronUp,
    Edit2, Trash2, Plus, Check, X
} from 'lucide-react';
import axios from 'axios';
import ContactModal from './ContactModal';

const ContactTable = ({ 
    contacts = [], 
    companyId,
    onUpdate,
    isLoading: propsLoading = false
}) => {
    const [expandedContact, setExpandedContact] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Gabungkan loading dari props dan internal state
    const isLoading = propsLoading || internalLoading;

    const toggleContact = (id) => {
        setExpandedContact(expandedContact === id ? null : id);
    };

    // Show success message
    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    // Open edit modal
    const handleEdit = (contact) => {
        console.log('Editing contact:', contact);
        setSelectedContact(contact);
        setIsEditModalOpen(true);
    };

    // Delete contact
    const handleDelete = async (contactId) => {
        if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
            return;
        }

        setInternalLoading(true);
        try {
            console.log('Deleting contact:', contactId);
            const response = await axios.delete(`/companies/${companyId}/contacts/${contactId}`);
            console.log('Delete response:', response.data);
            
            if (response.data.success) {
                // Update parent component
                if (onUpdate) {
                    onUpdate();
                }
                showSuccessMessage('Contact deleted successfully!');
            } else {
                throw new Error(response.data.message || 'Failed to delete contact');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert(error.response?.data?.message || 'Failed to delete contact');
        } finally {
            setInternalLoading(false);
        }
    };

    // Toggle primary contact
    const handleTogglePrimary = async (contactId) => {
        setInternalLoading(true);
        try {
            console.log('Toggling primary for contact:', contactId);
            const response = await axios.post(`/companies/${companyId}/contacts/${contactId}/toggle-primary`);
            console.log('Toggle primary response:', response.data);
            
            if (response.data.success) {
                // Update parent component
                if (onUpdate) {
                    onUpdate();
                }
                showSuccessMessage('Primary contact updated successfully!');
            } else {
                throw new Error(response.data.message || 'Failed to update primary contact');
            }
        } catch (error) {
            console.error('Error toggling primary:', error);
            alert(error.response?.data?.message || 'Failed to update primary contact');
        } finally {
            setInternalLoading(false);
        }
    };

    // Handle modal success
    const handleModalSuccess = (data, mode) => {
        console.log('Modal success:', mode, data);
        // Update parent component
        if (onUpdate) {
            onUpdate();
        }
        showSuccessMessage(`Contact ${mode === 'edit' ? 'updated' : 'added'} successfully!`);
    };

    // Mobile List View
    const MobileListView = () => (
        <div className="space-y-3">
            {contacts.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Contacts Found</h3>
                    <p className="text-gray-600 mb-4">Add your first contact person for this company</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        disabled={isLoading}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Contact
                    </button>
                </div>
            ) : (
                contacts.map((contact) => (
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
                                    <p className="text-xs text-gray-600">{contact.position || 'No position'}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button 
                                    onClick={() => handleTogglePrimary(contact.id)}
                                    className={`p-1.5 rounded-lg ${contact.is_primary 
                                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    title={contact.is_primary ? 'Primary Contact' : 'Set as Primary'}
                                    disabled={isLoading}
                                >
                                    <Star className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleEdit(contact)}
                                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                    title="Edit Contact"
                                    disabled={isLoading}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(contact.id)}
                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                    title="Delete Contact"
                                    disabled={isLoading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-xs text-gray-900 truncate">
                                    {contact.email || 'No email'}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-xs text-gray-900">
                                    {contact.phone || 'No phone'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex space-x-2">
                                {contact.is_primary && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <Check className="w-3 h-3 mr-1" />
                                        Primary
                                    </span>
                                )}
                                {contact.is_active === false && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <X className="w-3 h-3 mr-1" />
                                        Inactive
                                    </span>
                                )}
                            </div>
                            <button 
                                onClick={() => toggleContact(contact.id)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                {expandedContact === contact.id ? 
                                    <ChevronUp className="w-4 h-4" /> : 
                                    <ChevronDown className="w-4 h-4" />
                                }
                            </button>
                        </div>
                        
                        {expandedContact === contact.id && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex justify-around">
                                    <button className="flex flex-col items-center text-blue-600 hover:text-blue-800">
                                        <MessageSquare className="w-4 h-4 mb-1" />
                                        <span className="text-xs">Message</span>
                                    </button>
                                    <button className="flex flex-col items-center text-gray-600 hover:text-gray-800">
                                        <Phone className="w-4 h-4 mb-1" />
                                        <span className="text-xs">Call</span>
                                    </button>
                                    <button className="flex flex-col items-center text-green-600 hover:text-green-800">
                                        <Mail className="w-4 h-4 mb-1" />
                                        <span className="text-xs">Email</span>
                                    </button>
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
            {contacts.length === 0 ? (
                <div className="col-span-full bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Contacts Yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Start by adding contact persons to manage communications with this company.
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                        disabled={isLoading}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Your First Contact
                    </button>
                </div>
            ) : (
                contacts.map((contact) => (
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
                                        {contact.position || 'No position specified'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button 
                                    onClick={() => handleTogglePrimary(contact.id)}
                                    className={`p-1.5 rounded-lg ${contact.is_primary 
                                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    title={contact.is_primary ? 'Primary Contact' : 'Set as Primary'}
                                    disabled={isLoading}
                                >
                                    <Star className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleEdit(contact)}
                                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                    title="Edit Contact"
                                    disabled={isLoading}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(contact.id)}
                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                    title="Delete Contact"
                                    disabled={isLoading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {contact.email || 'No email provided'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {contact.phone || 'No phone provided'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex space-x-2">
                                {contact.is_primary && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <Check className="w-3 h-3 mr-1" />
                                        Primary Contact
                                    </span>
                                )}
                                {contact.is_active === false && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        <X className="w-3 h-3 mr-1" />
                                        Inactive
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex justify-between">
                                <button 
                                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                    onClick={() => window.location.href = `mailto:${contact.email}`}
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>Email</span>
                                </button>
                                <button 
                                    className="flex items-center space-x-2 text-green-600 hover:text-green-800 text-sm px-3 py-2 hover:bg-green-50 rounded-lg transition-colors"
                                    onClick={() => window.location.href = `tel:${contact.phone}`}
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>Call</span>
                                </button>
                                <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 text-sm px-3 py-2 hover:bg-purple-50 rounded-lg transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Message</span>
                                </button>
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
            {contacts.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Contacts Available</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Add contact persons to manage communications with this company.
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                        disabled={isLoading}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add First Contact
                    </button>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {contacts.map((contact) => (
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
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{contact.position || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 truncate max-w-xs">
                                                {contact.email || 'No email'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{contact.phone || 'No phone'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-2">
                                                {contact.is_primary ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Primary
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        Secondary
                                                    </span>
                                                )}
                                                {contact.is_active === false && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <X className="w-3 h-3 mr-1" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={() => handleTogglePrimary(contact.id)}
                                                    className={`p-1.5 rounded-lg ${contact.is_primary 
                                                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                    title={contact.is_primary ? 'Primary Contact' : 'Set as Primary'}
                                                    disabled={isLoading}
                                                >
                                                    <Star className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(contact)}
                                                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                                    title="Edit Contact"
                                                    disabled={isLoading}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(contact.id)}
                                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                    title="Delete Contact"
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="flex space-x-1">
                                                    <button 
                                                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Send Email"
                                                        onClick={() => window.location.href = `mailto:${contact.email}`}
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Make Call"
                                                        onClick={() => window.location.href = `tel:${contact.phone}`}
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
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
                    <h2 className="text-2xl font-bold text-gray-900">Contact Persons</h2>
                    <p className="text-gray-600 mt-1">Manage contact persons for this company</p>
                </div>
                
                {/* Controls */}
                <div className="flex items-center space-x-4">
                    {/* View Toggle */}
                    {contacts.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 hidden sm:block">View:</span>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'grid' 
                                        ? 'bg-white text-teal-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'}`}
                                    disabled={isLoading}
                                >
                                    Grid
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'list' 
                                        ? 'bg-white text-teal-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'}`}
                                    disabled={isLoading}
                                >
                                    List
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Add Button */}
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Adding...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                <span>Add Contact</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {propsLoading && contacts.length === 0 ? (
                <div className="flex flex-col justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-teal-600 mb-4"></div>
                    <span className="text-gray-600">Loading contacts...</span>
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-xl">
                                    <p className="text-sm font-medium text-blue-700 mb-2">Total Contacts</p>
                                    <p className="text-3xl font-bold text-blue-900">{contacts.length}</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-5 rounded-xl">
                                    <p className="text-sm font-medium text-green-700 mb-2">Primary Contacts</p>
                                    <p className="text-3xl font-bold text-green-900">
                                        {contacts.filter(c => c.is_primary).length}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-5 rounded-xl">
                                    <p className="text-sm font-medium text-purple-700 mb-2">Active Contacts</p>
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