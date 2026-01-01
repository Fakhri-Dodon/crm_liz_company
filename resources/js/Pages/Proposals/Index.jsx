import { React, useEffect, useState } from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import TableLayout from "@/Layouts/TableLayout";
import { Link, usePage, useForm, router } from "@inertiajs/react";
import ModalAdd from "@/Components/ModalAdd";
import PrimaryButton from "@/Components/PrimaryButton";
import { Search, Filter, Plus, Calendar, Download, RefreshCw } from 'lucide-react';
import DeleteConfirmationModal from "@/Components/DeleteConfirmationModal";
import NotificationModal from "@/Components/NotificationModal";
import { useTranslation } from "react-i18next";
// import DevelopmentPage from "../DevelopmentPage";
// import DevelopmentPage from "../DevelopmentPage";

export default function ProposalsIndex({ proposals, statusOptions, summary, filters, filterData, lead }) {
    // const dev = true
    // if (dev) {
    //     return <HeaderLayout><DevelopmentPage /></HeaderLayout>;

    // }
    // Dummy data


    const { t } = useTranslation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Debug: log totals to confirm prop is received from server
    useEffect(() => {
        console.log('Inertia summary:', summary);
    }, [summary]);

    const columns = [
        {
            key: "no",
            label: t('proposals.table.no_date'),
            render: (value, row) => (
                <div>
                    <a 
                        href="#"
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
            label: t('proposals.table.subject')
        },
        {
            key: "company_name",
            label: t('proposals.table.company_name'),
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
            label: t('proposals.table.contact'),
        },
        {
            key: "created_by",
            label: t('proposals.table.created_by'),
        },
        {
            key: 'status',
            label: t('proposals.table.status'),
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
                        <option value="draft">{t('quotations.stats.draft')}</option>
                        <option value="sent">{t('quotations.stats.sent')}</option>
                        <option value="accepted">{t('quotations.stats.accepted')}</option>
                        <option value="expired">{t('quotations.stats.expired')}</option>
                        <option value="rejected">{t('quotations.stats.rejected')}</option>
                    </select>
                );
            }
        }
    ];

    const [localFilters, setLocalFilters] = useState({
        search: filters?.search || '',
        status: filters?.status || 'all',
        proposal_id: filters?.proposal_id || '',
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
        get(route('proposal.index'), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            data: {
                proposal_id: localFilters.proposal_id,
                search: localFilters.search,
                status: localFilters.status !== 'all' ? localFilters.status : '',
            }
        });
    };

    const resetFilters = () => {
        const defaultFilters = {
            search: '',
            proposal_id: '',
            status: 'all',
        };
        setLocalFilters(defaultFilters);
        setData(defaultFilters);
        router.get(route('proposal.index'), {}, {
            replace: true,
            preserveState: false, 
            preserveScroll: true,
        });
    };

    const statusColors = {
        opened: { bg: 'bg-greed-100', text: 'text-greed-800', border: 'border-greed-200' },
        draft: { bg: 'bg-grey-100', text: 'text-grey-800', border: 'border-grey-200' },
        sent: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
        failed: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };

    const tableData = proposals.data.map((q) => ({
        id: q.id,
        no: q.proposal_number, 
        date: q.date,
        title: q.title || "-",
        company_name: q.lead?.company_name || "-",
        contact: q.lead?.contact_person || "-",
        created_by: q.creator?.name || "Admin", // Sesuaikan field ini
        status: q.status,
        edited: q.edited,
        element_id: q.proposal_element_template_id,
    }));

    const { data, setData, post, processing, errors, reset } = useForm({
        lead_id: "",
        name: "",
    });

    const handleAdd = () => {
        reset();
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        router.get(`/proposal/add`, data);
    };

    const handleEdit = (item) => {
        if (!item.edited) {
            router.visit(`/proposal/addProposal/${item.id}`);
        } else {
            router.visit('/proposal/create', {
            method: 'get',
            data: {
                id: item.element_id,
                id_proposal: item.id,
            },
});
        }
    };

    const handleDelete = (item) => {
        if (item && item.id) {
            router.delete(`/proposal/destroy/${item.id}`);
        } else {
            console.error("Data proposal tidak memiliki ID", item);
        }
    }

    const proposalOptions = Array.isArray(proposals) 
        ? [...new Set(proposals
            .filter(proposals => proposals.id)
            .map(proposals => proposals.title)
            .sort()
          )]
        : [];

    return (
        <>
            <ModalAdd
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Proposal"
                footer={
                    <>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2"
                        >
                            Cancle
                        </button>
                        <PrimaryButton
                            onClick={handleSubmit}
                            disabled={processing}
                            className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <span>Create</span>
                        </PrimaryButton>
                    </>
                }
            >
                {/* Isi Form Input Di Sini (Children) */}
                <div className="space-y-4">
                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                title*
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Company Name*
                            </label>
                            <div className="relative">
                                <select
                                    value={data.lead_id}
                                    onChange={e => setData('lead_id', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#005954] focus:border-transparent appearance-none transition-colors ${
                                        errors.lead_id ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    required
                                >
                                    <option value="" className="text-gray-400">Select Company Name</option>
                                    {lead && lead.map(leads => (
                                        <option key={leads.id} value={leads.id}>
                                            {leads.company_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ModalAdd>

            <HeaderLayout
                title="Proposals Management"
                subtitle="Manage all company proposals"
            />
            <div className="p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-8">
                    {Object.entries(statusColors).map(([status, colors]) => (
                        <div
                            key={status}
                            className={`rounded-xl p-4 sm:p-5 shadow-sm border ${colors.border} ${colors.bg} transition-transform hover:scale-[1.02] hover:shadow-md min-h-[110px] flex flex-col justify-between`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${colors.text} uppercase tracking-wide`}>
                                        {t(`proposals.stats.${status}`)}
                                    </p>
                                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                                        {summary[status] || 0}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${colors.bg} ${colors.text}`}>
                                    <div className={`w-3 h-3 rounded-full ${colors.text.replace('text-', 'bg-')}`}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ACTION BAR */}
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* SEARCH AND FILTERS */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                            {/* Company Filter */}
                            <div className="relative">
                                <select
                                    value={localFilters.proposal_id}
                                    onChange={(e) => handleFilterChange('proposal_id', e.target.value)}
                                    className="w-full px-6 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005954] focus:border-transparent bg-white text-sm"
                                >
                                    <option value="">{t('proposals.filters.all_proposal')}</option>
                                    {(proposalOptions || []).map(prop => (
                                        <option key={prop} value={prop}>
                                            {prop}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('proposals.filters.search_placeholder')}
                                    value={localFilters.search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:w-[280px] pl-10 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* ADD BUTTON */}
                        <PrimaryButton
                            onClick={handleAdd}
                            className="w-full sm:w-auto px-5 py-2.5 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{t('proposals.button_add')}</span>
                        </PrimaryButton>
                    </div>
                    
                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-600">
                        {t('proposals.filters.showing_info', { count: localFilters.length, total: proposals.length })}
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className="px-8 py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600 font-medium">{t('common.loading') || 'Loading...'}</p>
                        </div>
                    ) : localFilters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="h-12 w-12 text-gray-300 mb-4">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium mb-2">
                                {search ? t('proposals.empty.no_match') : t('proposals.empty.no_data')}
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                                {search ? t('proposals.empty.try_again') : t('proposals.empty.start_add')}
                            </p>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    {t('proposals.filters.clear_search')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <TableLayout
                                data={tableData}
                                columns={columns}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                showAction={true}
                            />
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}


import { ChevronDown } from 'lucide-react';