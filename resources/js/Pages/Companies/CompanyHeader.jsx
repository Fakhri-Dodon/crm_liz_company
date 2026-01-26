import React, { useState } from 'react';
import { Building2, MapPin, Globe, Mail, Phone, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CompanyHeader = ({ company, activeTab, data, statistics }) => {
    const [showTooltip, setShowTooltip] = useState(null);
    const { t } = useTranslation();
    
    const calculateStats = () => {
        switch (activeTab) {
            case 'profile':
                return [
                    { 
                        label: t('companies_header.total_contacts'), 
                        value: data.contacts?.length || 0, 
                        color: 'bg-blue-500' 
                    },
                    { 
                        label: t('companies_header.active_years'), 
                        value: company.client_since ? new Date().getFullYear() - new Date(company.client_since).getFullYear() : 0, 
                        color: 'bg-green-500' 
                    },
                    { 
                        label: t('companies_header.status'), 
                        value: company.is_active ? t('companies_header.active_status') : t('companies_header.inactive_status'), 
                        color: company.is_active ? 'bg-yellow-500' : 'bg-gray-500' 
                    },
                    { 
                        label: t('companies_header.client_type'), 
                        value: company.client_type?.name || 'N/A', 
                        color: 'bg-red-500' 
                    }
                ];
            
            case 'quotation':
                return [
                    { 
                        label: t('companies_header.total_quotations'), 
                        value: statistics.total_quotations || 0, 
                        color: 'bg-blue-500' 
                    },
                    { 
                        label: t('companies_header.accepted'), 
                        value: statistics.accepted_quotations || 0, 
                        color: 'bg-green-500' 
                    },
                    { 
                        label: t('companies_header.expired'), 
                        value: statistics.expired_quotations || 0, 
                        color: 'bg-yellow-500' 
                    },
                    { 
                        label: t('companies_header.cancelled'), 
                        value: statistics.cancelled_quotations || 0, 
                        color: 'bg-red-500' 
                    }
                ];
            
            case 'invoice':
                return [
                    { 
                        label: t('companies_header.total_invoices'), 
                        value: statistics.total_invoices || 0, 
                        color: 'bg-blue-500' 
                    },
                    { 
                        label: t('companies_header.paid'), 
                        value: statistics.paid_invoices || 0, 
                        color: 'bg-green-500' 
                    },
                    { 
                        label: t('companies_header.pending'), 
                        value: statistics.pending_invoices || 0, 
                        color: 'bg-yellow-500' 
                    },
                    { 
                        label: t('companies_header.overdue'), 
                        value: statistics.overdue_invoices || 0, 
                        color: 'bg-red-500' 
                    }
                ];
            
            case 'payment':
                const totalPayments = data.payments?.length || 0;
                const bankTransfers = data.payments?.filter(p => p.method === 'bank_transfer').length || 0;
                const cashPayments = data.payments?.filter(p => p.method === 'cash').length || 0;
                const checkPayments = data.payments?.filter(p => p.method === 'check').length || 0;
                
                return [
                    { 
                        label: t('companies_header.total_payments'), 
                        value: totalPayments, 
                        color: 'bg-blue-500' 
                    },
                    { 
                        label: t('companies_header.bank_transfer'), 
                        value: bankTransfers, 
                        color: 'bg-green-500' 
                    },
                    { 
                        label: t('companies_header.cash'), 
                        value: cashPayments, 
                        color: 'bg-yellow-500' 
                    },
                    { 
                        label: t('companies_header.check'), 
                        value: checkPayments, 
                        color: 'bg-red-500' 
                    }
                ];
            
            case 'project':
                const totalProjects = data.projects?.length || 0;
                const completedProjects = data.projects?.filter(p => p.status === 'completed').length || 0;
                const inProgressProjects = data.projects?.filter(p => p.status === 'in_progress').length || 0;
                const delayedProjects = data.projects?.filter(p => p.status === 'delayed').length || 0;
                
                return [
                    { 
                        label: t('companies_header.total_projects'), 
                        value: totalProjects, 
                        color: 'bg-blue-500' 
                    },
                    { 
                        label: t('companies_header.completed'), 
                        value: completedProjects, 
                        color: 'bg-green-500' 
                    },
                    { 
                        label: t('companies_header.in_progress'), 
                        value: inProgressProjects, 
                        color: 'bg-yellow-500' 
                    },
                    { 
                        label: t('companies_header.delayed'), 
                        value: delayedProjects, 
                        color: 'bg-red-500' 
                    }
                ];
            
            case 'contact':
                const primaryContacts = data.contacts?.filter(c => c.is_primary).length || 0;
                const totalContacts = data.contacts?.length || 0;
                const activeContacts = data.contacts?.filter(c => c.is_active).length || 0;
                
                return [
                    { 
                        label: t('companies_header.total_contacts'), 
                        value: totalContacts, 
                        color: 'bg-blue-500' 
                    },
                    { 
                        label: t('companies_header.primary_contacts'), 
                        value: primaryContacts, 
                        color: 'bg-green-500' 
                    },
                    { 
                        label: t('companies_header.active'), 
                        value: activeContacts, 
                        color: 'bg-yellow-500' 
                    },
                    { 
                        label: t('companies_header.management'), 
                        value: data.contacts?.filter(c => c.position?.toLowerCase().includes('manager')).length || 0, 
                        color: 'bg-red-500' 
                    }
                ];
            
            default:
                return [
                    { label: 'Total', value: '0', color: 'bg-blue-500' },
                    { label: t('companies_header.active'), value: '0', color: 'bg-green-500' },
                    { label: t('companies_header.pending'), value: '0', color: 'bg-yellow-500' },
                    { label: t('companies_header.inactive_status'), value: '0', color: 'bg-red-500' }
                ];
        }
    };

    const stats = calculateStats();

    // Format currency dengan singkatan
    const formatCurrency = (amount) => {
        if (amount >= 1000000000) {
            return `Rp${(amount / 1000000000).toFixed(1)}M`;
        }
        if (amount >= 1000000) {
            return `Rp${(amount / 1000000).toFixed(1)}Jt`;
        }
        if (amount >= 1000) {
            return `Rp${(amount / 1000).toFixed(0)}Rb`;
        }
        return `Rp${amount}`;
    };

    // Format full currency untuk tooltip
    const formatFullCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Hitung total outstanding dari invoices
    const totalOutstanding = data.invoices
        ?.filter(inv => inv.status !== 'paid')
        .reduce((sum, inv) => sum + (inv.amount_due || 0), 0) || 0;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
            return `${diffDays} ${t('companies_header.days_ago')}`;
        } else if (diffDays < 365) {
            return `${Math.floor(diffDays / 30)} ${t('companies_header.months_ago')}`;
        } else {
            return `${Math.floor(diffDays / 365)} ${t('companies_header.years_ago')}`;
        }
    };

    // Truncate text dengan tooltip
    const TruncatedText = ({ text, maxLength = 20, className = "" }) => {
        if (!text) return null;
        
        if (text.length <= maxLength) {
            return <span className={className}>{text}</span>;
        }
        
        return (
            <div className="relative inline-block">
                <span 
                    className={`${className} truncate max-w-[150px] sm:max-w-[200px] cursor-help`}
                    onMouseEnter={() => setShowTooltip(text)}
                    onMouseLeave={() => setShowTooltip(null)}
                >
                    {text.substring(0, maxLength)}...
                </span>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
            {/* Tooltip untuk text panjang */}
            {showTooltip && (
                <div className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg">
                    {showTooltip}
                </div>
            )}

            {/* Company Info - Responsive Layout */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 lg:mb-8 gap-6">
                {/* Left Section */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Logo */}
                    {company.logo_url ? (
                        <img 
                            src={company.logo_url} 
                            alt={company.client_code}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-md mx-auto sm:mx-0"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#054748] to-[#0a5d5e] rounded-xl flex items-center justify-center shadow-md mx-auto sm:mx-0">
                            <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                    )}
                    
                    {/* Company Details */}
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            <TruncatedText text={company.lead?.company_name || company.company_name || '-'} maxLength={25} />
                        </h1>
                        
                        {/* Contact Info */}
                        <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-sm text-gray-600">
                            {(company.city || company.province) && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <span className="sr-only">{t('companies_header.location')}: </span>
                                    <TruncatedText 
                                        text={`${company.city || ''}${company.province ? `, ${company.province}` : ''}${company.country ? `, ${company.country}` : ''}`}
                                        maxLength={30}
                                    />
                                </div>
                            )}
                            {company.website && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <Globe className="w-4 h-4 flex-shrink-0" />
                                    <span className="sr-only">{t('companies_header.website')}: </span>
                                    <TruncatedText text={company.website} maxLength={25} />
                                </div>
                            )}
                            {company.primary_contact?.email && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                    <span className="sr-only">{t('companies_header.email')}: </span>
                                    <TruncatedText text={company.primary_contact.email} maxLength={25} />
                                </div>
                            )}
                            {company.primary_contact?.phone && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <span className="sr-only">{t('companies_header.phone')}: </span>
                                    <TruncatedText text={company.primary_contact.phone} maxLength={20} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Outstanding Balance & Info */}
                <div className="text-center sm:text-right">
                    <p className="text-sm text-gray-500">{t('companies_header.total_outstanding')}</p>
                    <div className="relative inline-block">
                        <button
                            className="text-2xl sm:text-3xl font-bold text-red-600 cursor-pointer transition-all duration-200 hover:bg-gray-100 rounded px-2 py-1 flex items-center gap-2"
                            onClick={() => setShowTooltip(showTooltip === 'piutang' ? null : 'piutang')}
                            title={formatFullCurrency(totalOutstanding)}
                        >
                            {formatFullCurrency(totalOutstanding)}
                            <span className="ml-1 text-xs text-gray-400">{showTooltip === 'piutang' ? '▲' : '▼'}</span>
                        </button>
                        {/* Expand/Collapse: tampilkan detail jika di-expand */}
                        {showTooltip === 'piutang' && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-left">
                                <div className="mb-2 font-semibold text-gray-800">
                                    {t('companies_header.outstanding_details')}
                                </div>
                                {data.invoices?.filter(inv => inv.status !== 'Paid').length > 0 ? (
                                    <ul className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                                        {data.invoices.filter(inv => inv.status !== 'Paid').map((inv, idx) => (
                                            <li key={inv.id || idx} className="mb-1 flex justify-between">
                                                <span>{inv.invoice_number || '-'}</span>
                                                <span>{formatFullCurrency(inv.amount_due || 0)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-xs text-gray-500">
                                        {t('companies_header.no_outstanding_invoices')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {data.invoices?.filter(inv => inv.status !== 'Paid').length || 0} {t('companies_header.unpaid_invoices')}
                    </p>
                </div>
            </div>

            {/* Stats Cards - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className="flex items-center">
                            <div className={`w-1 h-8 sm:h-10 ${stat.color} rounded-full mr-3 flex-shrink-0`}></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                                        {stat.value}
                                    </p>
                                    {typeof stat.value === 'string' && stat.value.includes('Rp') && (
                                        <Info 
                                            className="w-4 h-4 text-gray-400 ml-2 cursor-help flex-shrink-0"
                                            onMouseEnter={() => {
                                                if (stat.value.includes('Rp')) {
                                                    const numericValue = stat.value.match(/\d+/)?.[0];
                                                    if (numericValue) {
                                                        setShowTooltip(formatFullCurrency(parseFloat(numericValue)));
                                                    }
                                                }
                                            }}
                                            onMouseLeave={() => setShowTooltip(null)}
                                        />
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompanyHeader;