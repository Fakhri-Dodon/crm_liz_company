import React, { useState } from 'react';
import { Building2, MapPin, Globe, Mail, Phone, Calendar, Info } from 'lucide-react';

const CompanyHeader = ({ company, activeTab, data, statistics }) => {
    const [showTooltip, setShowTooltip] = useState(null);
    
    // Fungsi untuk menghitung statistik berdasarkan tab aktif
    const calculateStats = () => {
        switch (activeTab) {
            case 'profile':
                return [
                    { label: 'Total Kontak', value: data.contacts?.length || 0, color: 'bg-blue-500' },
                    { label: 'Tahun Aktif', value: company.client_since ? new Date().getFullYear() - new Date(company.client_since).getFullYear() : 0, color: 'bg-green-500' },
                    { label: 'Status', value: company.is_active ? 'Aktif' : 'Non-Aktif', color: company.is_active ? 'bg-yellow-500' : 'bg-gray-500' },
                    { label: 'Tipe Klien', value: company.client_type?.name || 'N/A', color: 'bg-red-500' }
                ];
            
            case 'quotation':
                return [
                    { label: 'Total Quotation', value: statistics.total_quotations || 0, color: 'bg-blue-500' },
                    { label: 'Diterima', value: statistics.accepted_quotations || 0, color: 'bg-green-500' },
                    { label: 'Kadaluarsa', value: statistics.expired_quotations || 0, color: 'bg-yellow-500' },
                    { label: 'Dibatalkan', value: statistics.cancelled_quotations || 0, color: 'bg-red-500' }
                ];
            
            case 'invoice':
                return [
                    { label: 'Total Invoice', value: statistics.total_invoices || 0, color: 'bg-blue-500' },
                    { label: 'Dibayar', value: statistics.paid_invoices || 0, color: 'bg-green-500' },
                    { label: 'Pending', value: statistics.pending_invoices || 0, color: 'bg-yellow-500' },
                    { label: 'Jatuh Tempo', value: statistics.overdue_invoices || 0, color: 'bg-red-500' }
                ];
            
            case 'payment':
                const totalPayments = data.payments?.length || 0;
                const bankTransfers = data.payments?.filter(p => p.method === 'bank_transfer').length || 0;
                const cashPayments = data.payments?.filter(p => p.method === 'cash').length || 0;
                const checkPayments = data.payments?.filter(p => p.method === 'check').length || 0;
                
                return [
                    { label: 'Total Pembayaran', value: totalPayments, color: 'bg-blue-500' },
                    { label: 'Transfer Bank', value: bankTransfers, color: 'bg-green-500' },
                    { label: 'Tunai', value: cashPayments, color: 'bg-yellow-500' },
                    { label: 'Cek', value: checkPayments, color: 'bg-red-500' }
                ];
            
            case 'project':
                const totalProjects = data.projects?.length || 0;
                const completedProjects = data.projects?.filter(p => p.status === 'completed').length || 0;
                const inProgressProjects = data.projects?.filter(p => p.status === 'in_progress').length || 0;
                const delayedProjects = data.projects?.filter(p => p.status === 'delayed').length || 0;
                
                return [
                    { label: 'Total Proyek', value: totalProjects, color: 'bg-blue-500' },
                    { label: 'Selesai', value: completedProjects, color: 'bg-green-500' },
                    { label: 'Dalam Proses', value: inProgressProjects, color: 'bg-yellow-500' },
                    { label: 'Terlambat', value: delayedProjects, color: 'bg-red-500' }
                ];
            
            case 'contact':
                const primaryContacts = data.contacts?.filter(c => c.is_primary).length || 0;
                const totalContacts = data.contacts?.length || 0;
                const activeContacts = data.contacts?.filter(c => c.is_active).length || 0;
                
                return [
                    { label: 'Total Kontak', value: totalContacts, color: 'bg-blue-500' },
                    { label: 'Kontak Utama', value: primaryContacts, color: 'bg-green-500' },
                    { label: 'Aktif', value: activeContacts, color: 'bg-yellow-500' },
                    { label: 'Management', value: data.contacts?.filter(c => c.position?.toLowerCase().includes('manager')).length || 0, color: 'bg-red-500' }
                ];
            
            default:
                return [
                    { label: 'Total', value: '0', color: 'bg-blue-500' },
                    { label: 'Aktif', value: '0', color: 'bg-green-500' },
                    { label: 'Pending', value: '0', color: 'bg-yellow-500' },
                    { label: 'Non-Aktif', value: '0', color: 'bg-red-500' }
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
            return `${diffDays} hari lalu`;
        } else if (diffDays < 365) {
            return `${Math.floor(diffDays / 30)} bulan lalu`;
        } else {
            return `${Math.floor(diffDays / 365)} tahun lalu`;
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
                            <TruncatedText text={company.client_code} maxLength={25} />
                        </h1>
                        
                        {/* Contact Info */}
                        <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-sm text-gray-600">
                            {(company.city || company.province) && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                    <TruncatedText 
                                        text={`${company.city || ''}${company.province ? `, ${company.province}` : ''}${company.country ? `, ${company.country}` : ''}`}
                                        maxLength={30}
                                    />
                                </div>
                            )}
                            {company.website && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <Globe className="w-4 h-4 flex-shrink-0" />
                                    <TruncatedText text={company.website} maxLength={25} />
                                </div>
                            )}
                            {company.primary_contact?.email && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                    <TruncatedText text={company.primary_contact.email} maxLength={25} />
                                </div>
                            )}
                            {company.primary_contact?.phone && (
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <TruncatedText text={company.primary_contact.phone} maxLength={20} />
                                </div>
                            )}
                        </div>
                        
                        {/* Badges */}
                        <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                <TruncatedText text={`Kode: ${company.client_code}`} maxLength={15} />
                            </span>
                            {company.client_type && (
                                <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                    <TruncatedText text={company.client_type.name} maxLength={15} />
                                </span>
                            )}
                            {company.nib && (
                                <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                    <TruncatedText text={`NIB: ${company.nib}`} maxLength={15} />
                                </span>
                            )}
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                company.is_active 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                            }`}>
                                {company.is_active ? 'Aktif' : 'Non-Aktif'}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Outstanding Balance & Info */}
                <div className="text-center sm:text-right">
                    <p className="text-sm text-gray-500">Total Piutang</p>
                    <div className="relative inline-block">
                        <p 
                            className="text-2xl sm:text-3xl font-bold text-red-600 cursor-help"
                            onMouseEnter={() => setShowTooltip(formatFullCurrency(totalOutstanding))}
                            onMouseLeave={() => setShowTooltip(null)}
                        >
                            {formatCurrency(totalOutstanding)}
                        </p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {data.invoices?.filter(inv => inv.status !== 'paid').length || 0} invoice belum dibayar
                    </p>
                    {company.client_since && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-2 flex items-center justify-center sm:justify-end space-x-1">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>Klien sejak: {formatDate(company.client_since)}</span>
                        </p>
                    )}
                    {company.created_at && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Dibuat: {formatDate(company.created_at)}
                        </p>
                    )}
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