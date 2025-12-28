import React from 'react';
import { 
    FileText, 
    Calendar, 
    DollarSign, 
    CheckCircle, 
    Clock, 
    AlertCircle,
    TrendingUp,
    Percent
} from 'lucide-react';

const InvoiceTable = ({ data }) => {
    // Format currency
    const formatCurrency = (amount) => {
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
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Paid
                    </span>
                );
            case 'unpaid':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        Unpaid
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Overdue
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Invoice List</h2>
                <p className="text-gray-600">All invoices issued to this company</p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#e2e8f0]">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Invoice Number
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Date
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Amount
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <Percent className="w-4 h-4 mr-2" />
                                    PPN
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Amount Due
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {invoice.invoice_number}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatDate(invoice.date)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">
                                        {formatCurrency(invoice.invoice_amount)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatCurrency(invoice.ppn)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900">
                                        {formatCurrency(invoice.amount_due)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(invoice.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                                        View
                                    </button>
                                    <button className={`${invoice.status !== 'paid' ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'}`}>
                                        {invoice.status !== 'paid' ? 'Mark as Paid' : 'Paid'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Invoices</p>
                        <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(data.reduce((sum, i) => sum + i.invoice_amount, 0))}
                        </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Due</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(data.reduce((sum, i) => sum + i.amount_due, 0))}
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total PPN</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(data.reduce((sum, i) => sum + i.ppn, 0))}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceTable;