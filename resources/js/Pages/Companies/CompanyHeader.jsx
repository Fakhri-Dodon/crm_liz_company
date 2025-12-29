import React from 'react';
import { Building2, MapPin, Globe, Mail, Phone, Calendar } from 'lucide-react';

const CompanyHeader = ({ company, activeTab, data, statistics }) => {
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

    // Format currency
    const formatCurrency = (amount) => {
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
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Company Info */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-start space-x-4">
                    {company.logo_url ? (
                        <img 
                            src={company.logo_url} 
                            alt={company.client_code}
                            className="w-20 h-20 rounded-xl object-cover shadow-md"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-[#054748] to-[#0a5d5e] rounded-xl flex items-center justify-center shadow-md">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{company.client_code}</h1>
                        <div className="flex items-center space-x-4 mt-2 text-gray-600">
                            {(company.city || company.province) && (
                                <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>
                                        {company.city}{company.province ? `, ${company.province}` : ''}
                                        {company.country ? `, ${company.country}` : ''}
                                    </span>
                                </div>
                            )}
                            {company.website && (
                                <div className="flex items-center space-x-1">
                                    <Globe className="w-4 h-4" />
                                    <span>{company.website}</span>
                                </div>
                            )}
                            {company.primary_contact?.email && (
                                <div className="flex items-center space-x-1">
                                    <Mail className="w-4 h-4" />
                                    <span>{company.primary_contact.email}</span>
                                </div>
                            )}
                            {company.primary_contact?.phone && (
                                <div className="flex items-center space-x-1">
                                    <Phone className="w-4 h-4" />
                                    <span>{company.primary_contact.phone}</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 space-x-3">
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                Kode: {company.client_code}
                            </span>
                            {company.client_type && (
                                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                                    {company.client_type.name}
                                </span>
                            )}
                            {company.nib && (
                                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                                    NIB: {company.nib}
                                </span>
                            )}
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
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
                <div className="text-right">
                    <p className="text-sm text-gray-500">Total Piutang</p>
                    <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(totalOutstanding)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {data.invoices?.filter(inv => inv.status !== 'paid').length || 0} invoice belum dibayar
                    </p>
                    {company.client_since && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center justify-end space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Klien sejak: {formatDate(company.client_since)}</span>
                        </p>
                    )}
                    {company.created_at && (
                        <p className="text-sm text-gray-500 mt-1">
                            Dibuat: {new Date(company.created_at).toLocaleDateString('id-ID')}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className="flex items-center">
                            <div className={`w-1 h-10 ${stat.color} rounded-full mr-3`}></div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompanyHeader;