import HeaderLayout from "@/Layouts/HeaderLayout";
import { useEffect, useState } from "react";
import { usePage, useForm } from "@inertiajs/react";
import TableLayout from "@/Layouts/TableLayout";
import { router, Link } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import { Search, Filter, Plus, Calendar, Download, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

export const toast = (title, icon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: icon,
        title: title
    });
};

export default function QoutationsIndex({ quotations, statusOptions, summary, years, filters }) {
    const columns = [
        {
            key: "no",
            label: "No & Date",
            render: (value, row) => (
                <div>
                    <a 
                        href={`/storage/${row.pdf_path}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                        {value}
                    </a>
                    <div className="text-gray-500 text-sm mt-1">
                        {row.date || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "subject",
            label: "Subject",
        },
        {
            key: "company_name",
            label: "Company Name",
            render: (value, row) => {
                const isClient = !!row.is_client; 
                
                return (
                    <span className={`font-medium ${isClient ? 'text-blue-600' : 'text-black'}`}>
                        {row.lead?.company_name || value}
                    </span>
                );
            }
        },
        {
            key: "contact",
            label: "Contact",
        },
        {
            key: "created_by",
            label: "Created By",
        },
        {
            key: "total",
            label: "Total",
            render: (value) => (
                <div>
                    <div className="font-medium text-gray-900">
                        {value}
                    </div>
                    <div className="text-red-500 text-xs font-semibold mt-0.5 text-right">
                        Include PPN
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => {
                const statusStyles = {
                    sent: 'border-blue-500 text-blue-700 bg-blue-50',
                    accepted: 'border-green-500 text-green-700 bg-green-50',
                    expired: 'border-orange-500 text-orange-700 bg-orange-50',
                    rejected: 'border-red-500 text-red-700 bg-red-50',
                    draft: 'border-gray-500 text-gray-700 bg-gray-50',
                };

                const handleStatusChange = (e) => {
                    const newStatus = e.target.value;
                    
                    router.patch(route('quotation.update-status', row.id), {
                        status: newStatus
                    }, {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast('Status updated to ' + newStatus.toUpperCase());
                        },
                        onError: () => {
                            toast('Failed to update status', 'error');
                        }
                    });
                };

                return (
                    <select
                        value={value}
                        onChange={handleStatusChange}
                        style={{ 
                            backgroundImage: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none'
                        }}
                        className={`appearance-none text-xs font-bold py-1 px-2 rounded-lg border-2 focus:ring-0 cursor-pointer transition-all ${statusStyles[value] || 'border-gray-300'}`}
                    >
                        <option value="draft">DRAFT</option>
                        <option value="sent">SENT</option>
                        <option value="accepted">ACCEPTED</option>
                        <option value="expired">EXPIRED</option>
                        <option value="rejected">REJECTED</option>
                    </select>
                );
            }
        }
    ];

    const [localFilters, setLocalFilters] = useState({
        search: filters?.search || '',
        status: filters?.status || 'all',
        month: filters?.month || '',
        year: filters?.year || ''
    });

    useEffect(() => {
        setLocalFilters({
            search: filters?.search || '',
            status: filters?.status || 'all',
            month: filters?.month || '',
            year: filters?.year || ''
        });
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
        setData(key, value); 
    };

    const applyFilters = () => {
        get(route('quotation.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            data: {
                search: localFilters.search,
                status: localFilters.status !== 'all' ? localFilters.status : '',
                month: localFilters.month,
                year: localFilters.year
            }
        });
    };

    const resetFilters = () => {
        const defaultFilters = {
            search: '',
            status: 'all',
            month: '',
            year: ''
        };
        setLocalFilters(defaultFilters);
        setData(defaultFilters);
        router.get(route('quotation.index'), {}, {
            replace: true,
            preserveState: false, 
            preserveScroll: true,
        });
    };


    const months = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'Jan' },
        { value: '2', label: 'Feb' },
        { value: '3', label: 'Mar' },
        { value: '4', label: 'Apr' },
        { value: '5', label: 'May' },
        { value: '6', label: 'Jun' },
        { value: '7', label: 'Jul' },
        { value: '8', label: 'Aug' },
        { value: '9', label: 'Sep' },
        { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' },
        { value: '12', label: 'Dec' }
    ];

    const statusColors = {
        sent: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
        accepted: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
        expired: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };

    const tableData = quotations.data.map((q) => ({
        id: q.id,
        no: q.quotation_number, 
        date: q.date,
        subject: q.subject || "-",
        company_name: q.lead?.company_name || "-",
        contact: q.lead?.contact_person || "-",
        created_by: q.creator?.name || "Admin", // Sesuaikan field ini
        total: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(q.total || 0),
        status: q.status,
        pdf_path: q.pdf_path,
        is_client: q.is_client
    }));

    const { data, setData, get } = useForm({
        search: filters?.search || '',
        status: filters?.status || 'all',
        month: filters?.month || '',
        year: filters?.year || ''
    });

    const handleEdit = (item) => {
        if (item && item.id) {
            router.visit(`/quotation/edit/${item.id}`);
        } else {
            console.error("Data quotation tidak memiliki ID", item);
        }
    };

    const handleDelete = (item) => {
        if (item && item.id) {
            router.delete(`/quotation/destroy/${item.id}`);
        } else {
            console.error("Data quotation tidak memiliki ID", item);
        }
    }

    const handleAdd = () => {
        router.visit("/quotation/create")
    }

    
    return (
        <>
            <HeaderLayout title="Qoutations" />

            <div className="px-8 py-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <h1 className="text-xl font-black uppercase tracking-widest text-gray-800">
                        Quotations
                    </h1>

                    {/* ADD BUTTON */}
                    <PrimaryButton
                        onClick={handleAdd}
                        className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        <span>Add Quotation</span>
                    </PrimaryButton>
                </div>

                {/* Status Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 my-7">
                    {Object.entries(statusColors).map(([status, colors]) => (
                        <div 
                            key={status}
                            className={`rounded-xl p-5 shadow-sm border ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}>
                                        {statusOptions.find(opt => opt.value === status)?.label || status}
                                    </p>
                                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                        {summary[status] || 0}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${colors.bg} ${colors.text}`}>
                                    <div className={`w-3 h-3 rounded-full ${colors.text.replace('text-', 'bg-')}`}></div>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    {status === 'in_progress' ? 'Active projects' : 
                                    status === 'completed' ? 'Successfully delivered' :
                                    status === 'pending' ? 'Awaiting action' : 'Terminated projects'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>  

                {/* Filter Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                        {/* Search Input */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search Quotations
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by subject or client"
                                    value={localFilters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent transition-colors"
                                />
                            </div>
                        </div>

                        {/* Filter Grid - 2 columns on mobile, 3 on desktop */}
                        <div className="grid grid-cols-2 lg:flex lg:space-x-4 gap-4">
                            {/* Status Filter */}
                            <div className="lg:w-40">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={localFilters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                                >
                                    <option value="all">All Status</option>
                                    {statusOptions?.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Month Filter */}
                            <div className="lg:w-40">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Month
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <select
                                        value={localFilters.month}
                                        onChange={(e) => handleFilterChange('month', e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                                    >
                                        {months.map(month => (
                                            <option key={month.value} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Year Filter */}
                            <div className="lg:w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Year
                                </label>
                                <select
                                    value={localFilters.year}
                                    onChange={(e) => handleFilterChange('year', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                                >
                                    <option value="">All Years</option>
                                    {(years || []).map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2.5 bg-[#005954] text-white rounded-lg hover:bg-[#004d47] flex items-center gap-2 transition-colors justify-center text-sm font-medium"
                            >
                                <Filter className="w-4 h-4" />
                                Apply
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center text-sm font-medium"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="py-8">
                    <TableLayout
                        data={tableData}
                        columns={columns}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        showAction={true}
                    />
                </div>
            </div>
        </>
    );
}
