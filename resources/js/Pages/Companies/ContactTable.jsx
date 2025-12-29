import React from 'react';
import { 
    User, 
    Mail, 
    Phone, 
    Briefcase, 
    Star,
    MessageSquare,
    Building
} from 'lucide-react';

const ContactTable = ({ data }) => {
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Contact Persons</h2>
                <p className="text-gray-600">All contact persons for this company</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((contact) => (
                    <div 
                        key={contact.id} 
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#054748] to-[#0a5d5e] rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {contact.name}
                                        {contact.is_primary && (
                                            <Star className="w-4 h-4 text-yellow-500 inline-block ml-2" />
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-600">{contact.position}</p>
                                </div>
                            </div>
                            {contact.is_primary && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                    <Star className="w-4 h-4 mr-1" />
                                    Primary
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium text-gray-900">{contact.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Phone className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium text-gray-900">{contact.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Building className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="font-medium text-gray-900">
                                        {contact.position.includes('Manager') ? 'Management' : 
                                         contact.position.includes('Finance') ? 'Finance' : 'Operations'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex justify-between">
                                <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="text-sm font-medium">Message</span>
                                </button>
                                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm font-medium">Call</span>
                                </button>
                                <button className="flex items-center space-x-2 text-green-600 hover:text-green-800">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm font-medium">Email</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Contact Button */}
            <div className="mt-8 flex justify-center">
                <button className="flex items-center space-x-2 px-6 py-3 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Add New Contact</span>
                </button>
            </div>

            {/* Summary */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Contacts</p>
                        <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Primary Contacts</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {data.filter(c => c.is_primary).length}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Management Level</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {data.filter(c => c.position.toLowerCase().includes('manager')).length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactTable;