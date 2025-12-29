import React, { useState } from 'react';
import { 
    FileText, Calendar, DollarSign, CheckCircle, Clock, 
    AlertCircle, TrendingUp, Percent, Eye, Check
} from 'lucide-react';

const InvoiceTable = ({ data }) => {
    const [tooltip, setTooltip] = useState(null);
    
    // Format currency untuk mobile
    const formatCurrency = (amount) => {
        if (amount >= 1000000000) return `Rp${(amount / 1000000000).toFixed(1)}M`;
        if (amount >= 1000000) return `Rp${(amount / 1000000).toFixed(1)}Jt`;
        if (amount >= 1000) return `Rp${(amount / 1000).toFixed(0)}Rb`;
        return `Rp${amount}`;
    };

    const formatFullCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `${diffDays}d`;
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getStatusBadge = (status) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs";
        
        switch (status) {
            case 'paid':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Paid</span>
                    </span>
                );
            case 'unpaid':
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                        <Clock className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Unpaid</span>
                    </span>
                );
            case 'overdue':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800`}>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Overdue</span>
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

    // Mobile Card View
    const MobileCardView = ({ invoice }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                            {invoice.invoice_number}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {new Date(invoice.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
                {getStatusBadge(invoice.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p 
                        className="text-sm font-bold text-gray-900"
                        onMouseEnter={() => setTooltip(formatFullCurrency(invoice.invoice_amount))}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        {formatCurrency(invoice.invoice_amount)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Due</p>
                    <p 
                        className="text-sm font-bold text-red-600"
                        onMouseEnter={() => setTooltip(formatFullCurrency(invoice.amount_due))}
                        onMouseLeave={() => setTooltip(null)}
                    >
                        {formatCurrency(invoice.amount_due)}
                    </p>
                </div>
            </div>
            
            <div className="flex justify-between">
                <button className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                </button>
                <button className={`flex items-center space-x-1 px-3 py-1 rounded text-xs ${
                    invoice.status !== 'paid' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                }`}>
                    <Check className="w-3 h-3" />
                    <span>{invoice.status !== 'paid' ? 'Mark Paid' : 'Paid'}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div>
            {tooltip && (
                <div className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg">
                    {tooltip}
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Invoice List</h2>
                <p className="text-sm md:text-base text-gray-600">All invoices issued to this company</p>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden space-y-3">
                {data.map((invoice) => (
                    <MobileCardView key={invoice.id} invoice={invoice} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <div className="overflow-x-auto -mx-2">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-[#e2e8f0]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Invoice #
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Due
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">
                                            {invoice.invoice_number}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">
                                            {formatDate(invoice.date)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div 
                                            className="font-semibold text-gray-900 cursor-help"
                                            onMouseEnter={() => setTooltip(formatFullCurrency(invoice.invoice_amount))}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            {formatCurrency(invoice.invoice_amount)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div 
                                            className="font-bold text-gray-900 cursor-help"
                                            onMouseEnter={() => setTooltip(formatFullCurrency(invoice.amount_due))}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            {formatCurrency(invoice.amount_due)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(invoice.status)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex space-x-3">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                View
                                            </button>
                                            <button className={invoice.status !== 'paid' ? 'text-green-600 hover:text-green-900' : 'text-gray-400'}>
                                                {invoice.status !== 'paid' ? 'Mark Paid' : 'Paid'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Invoices</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Amount</p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, i) => sum + i.invoice_amount, 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, i) => sum + i.invoice_amount, 0))}
                        </p>
                    </div>
                    <div className="bg-red-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Due</p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, i) => sum + i.amount_due, 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, i) => sum + i.amount_due, 0))}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total PPN</p>
                        <p 
                            className="text-lg md:text-2xl font-bold text-gray-900 cursor-help"
                            onMouseEnter={() => setTooltip(formatFullCurrency(data.reduce((sum, i) => sum + i.ppn, 0)))}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            {formatCurrency(data.reduce((sum, i) => sum + i.ppn, 0))}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceTable;