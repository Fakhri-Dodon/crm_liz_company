import React, { useState } from 'react';
import { 
    User, Mail, Phone, Briefcase, Star,
    MessageSquare, Building, ChevronDown, ChevronUp
} from 'lucide-react';

const ContactTable = ({ data }) => {
    const [expandedContact, setExpandedContact] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    
    const toggleContact = (id) => {
        setExpandedContact(expandedContact === id ? null : id);
    };

    // Mobile List View
    const MobileListView = () => (
        <div className="space-y-3">
            {data.map((contact) => (
                <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#054748] to-[#0a5d5e] rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">
                                    {contact.name}
                                    {contact.is_primary && (
                                        <Star className="w-3 h-3 text-yellow-500 inline-block ml-1" />
                                    )}
                                </h3>
                                <p className="text-xs text-gray-600">{contact.position}</p>
                            </div>
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
                    
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-900 truncate">
                                {contact.email}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-900">
                                {contact.phone}
                            </span>
                        </div>
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
            ))}
        </div>
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Contact Persons</h2>
                    <p className="text-sm md:text-base text-gray-600">All contact persons for this company</p>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 hidden sm:block">View:</span>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'}`}
                            >
                                Grid
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white'}`}
                            >
                                List
                            </button>
                        </div>
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors text-sm">
                        <User className="w-4 h-4" />
                        <span>Add Contact</span>
                    </button>
                </div>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden">
                <MobileListView />
            </div>

            {/* Desktop Grid View */}
            <div className="hidden sm:block">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {data.map((contact) => (
                        <div 
                            key={contact.id} 
                            className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#054748] to-[#0a5d5e] rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold text-gray-900">
                                            {contact.name}
                                            {contact.is_primary && (
                                                <Star className="w-4 h-4 text-yellow-500 inline-block ml-2" />
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600 truncate max-w-[150px]">
                                            {contact.position}
                                        </p>
                                    </div>
                                </div>
                                {contact.is_primary && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <Star className="w-3 h-3 mr-1" />
                                        Primary
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Mail className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm md:text-base font-medium text-gray-900 truncate">
                                            {contact.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <Phone className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm md:text-base font-medium text-gray-900">
                                            {contact.phone}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 md:mt-6 pt-4 border-t border-gray-100">
                                <div className="flex justify-between">
                                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Message</span>
                                    </button>
                                    <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm">
                                        <Phone className="w-4 h-4" />
                                        <span>Call</span>
                                    </button>
                                    <button className="flex items-center space-x-2 text-green-600 hover:text-green-800 text-sm">
                                        <Mail className="w-4 h-4" />
                                        <span>Email</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 md:mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Contacts</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Primary Contacts</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(c => c.is_primary).length}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Management Level</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(c => c.position.toLowerCase().includes('manager')).length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactTable;