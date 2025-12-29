import React, { useState } from 'react';
import { 
    CreditCard, Calendar, DollarSign, Building, 
    FileText, Landmark, MessageSquare, Receipt, Edit
} from 'lucide-react';

const PaymentTable = ({ data }) => {
    const [expandedNote, setExpandedNote] = useState(null);
    
    const formatCurrency = (amount) => {
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
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getMethodBadge = (method) => {
        const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs";
        
        switch (method) {
            case 'bank_transfer':
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                        <Landmark className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Transfer</span>
                    </span>
                );
            case 'cash':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Cash</span>
                    </span>
                );
            case 'check':
                return (
                    <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
                        <CreditCard className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Check</span>
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {method}
                    </span>
                );
        }
    };

    // Mobile Card View
    const MobileCardView = ({ payment }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900 text-sm">
                            {payment.invoice_number}
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500">
                        {formatDate(payment.date)}
                    </p>
                </div>
                {getMethodBadge(payment.method)}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-bold text-green-900">
                        {formatCurrency(payment.amount)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Bank</p>
                    <p className="text-sm text-gray-900">
                        {payment.bank || '-'}
                    </p>
                </div>
            </div>
            
            {/* Notes with expand/collapse */}
            {payment.note && (
                <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <div className="text-xs text-gray-700">
                        {expandedNote === payment.id || payment.note.length < 60 ? (
                            <>{payment.note}</>
                        ) : (
                            <>
                                {payment.note.substring(0, 60)}...
                                <button 
                                    onClick={() => setExpandedNote(payment.id)}
                                    className="text-blue-600 hover:text-blue-800 ml-1"
                                >
                                    Read more
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    <Receipt className="w-3 h-3" />
                    <span>Receipt</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs">
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                </button>
            </div>
        </div>
    );

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Payment History</h2>
                <p className="text-sm md:text-base text-gray-600">All payments received from this company</p>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden">
                {data.map((payment) => (
                    <MobileCardView key={payment.id} payment={payment} />
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
                                    Method
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Bank
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Notes
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-blue-900">
                                            {payment.invoice_number}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">
                                            {formatDate(payment.date)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-green-900">
                                            {formatCurrency(payment.amount)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {getMethodBadge(payment.method)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">
                                            {payment.bank || '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 max-w-[150px]">
                                        <div className="text-gray-900 truncate" title={payment.note}>
                                            {payment.note || 'No notes'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex space-x-3">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                Receipt
                                            </button>
                                            <button className="text-gray-600 hover:text-gray-900">
                                                Edit
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
                        <p className="text-xs md:text-sm text-gray-600">Total Payments</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Total Received</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {formatCurrency(data.reduce((sum, p) => sum + p.amount, 0))}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Bank Transfers</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {data.filter(p => p.method === 'bank_transfer').length}
                        </p>
                    </div>
                    <div className="bg-yellow-50 p-3 md:p-4 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600">Average Payment</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {formatCurrency(data.length > 0 ? data.reduce((sum, p) => sum + p.amount, 0) / data.length : 0)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentTable;