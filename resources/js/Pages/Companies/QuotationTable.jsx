import React, { useState } from 'react';
import { FileText, Calendar, DollarSign, CheckCircle, Clock, XCircle, Download, Eye } from 'lucide-react';

const QuotationTable = ({ data }) => {
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
    
    // Format currency untuk mobile friendly
    const formatCurrency = (amount) => {
        if (amount >= 1000000000) {
            return `Rp${(amount / 1000000000).toFixed(1)}M`;
        }
        if (amount >= 1000000) {
            return `Rp${(amount / 1000000).toFixed(1)}Jt`;
        }
        return `Rp${amount.toLocaleString('id-ID')}`;
    };

    const formatFullCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Status badge
    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
        
        switch (status) {
            case 'approved':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                    </span>
                );
            case 'pending':
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </span>
                );
            case 'rejected':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800`}>
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {status}
                    </span>
                );
        }
    };

    // Truncate text
    const TruncatedText = ({ text, maxLength = 30, className = "" }) => {
        if (!text) return null;
        return text.length > maxLength ? (
            <span className={`${className} truncate`} title={text}>
                {text.substring(0, maxLength)}...
            </span>
        ) : (
            <span className={className}>{text}</span>
        );
    };

    // Mobile Card View
    const CardView = () => (
        <div className="space-y-4">
            {data.map((quotation) => (
                <div key={quotation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">
                                    {quotation.quotation_number}
                                </h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                <TruncatedText text={quotation.subject} maxLength={40} />
                            </p>
                        </div>
                        {getStatusBadge(quotation.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-medium text-gray-900">
                                {formatDate(quotation.date)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Amount</p>
                            <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(quotation.total)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-2">
                        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm">
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Quotation List</h2>
                    <p className="text-sm md:text-base text-gray-600">All quotations sent to this company</p>
                </div>
                
                {/* View Toggle for Mobile */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 hidden sm:block">View:</span>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1 text-sm ${viewMode === 'table' ? 'bg-gray-200' : 'bg-white'}`}
                        >
                            Table
                        </button>
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-1 text-sm ${viewMode === 'card' ? 'bg-gray-200' : 'bg-white'}`}
                        >
                            Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden">
                <CardView />
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto -mx-2">
                    <table className="min-w-full divide-y divide-gray-200 text-sm md:text-base">
                        <thead className="bg-[#e2e8f0]">
                            <tr>
                                <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Quotation #
                                    </div>
                                </th>
                                <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Date
                                    </div>
                                </th>
                                <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Amount
                                    </div>
                                </th>
                                <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((quotation) => (
                                <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm md:text-base font-medium text-gray-900">
                                            {quotation.quotation_number}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm md:text-base text-gray-900">
                                            {formatDate(quotation.date)}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="max-w-[200px] lg:max-w-[300px]">
                                            <TruncatedText 
                                                text={quotation.subject} 
                                                maxLength={50}
                                                className="text-sm md:text-base text-gray-900"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm md:text-base font-semibold text-gray-900">
                                            {formatCurrency(quotation.total)}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(quotation.status)}
                                    </td>
                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <button className="text-blue-600 hover:text-blue-900 text-sm md:text-base">
                                                View
                                            </button>
                                            <button className="text-green-600 hover:text-green-900 text-sm md:text-base">
                                                Download
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary - Responsive */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Quotations</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Value</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900" title={formatFullCurrency(data.reduce((sum, q) => sum + q.total, 0))}>
                            {formatCurrency(data.reduce((sum, q) => sum + q.total, 0))}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Average Value</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {formatCurrency(data.length > 0 ? data.reduce((sum, q) => sum + q.total, 0) / data.length : 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationTable;