// resources/js/Pages/Companies/Sidebar.jsx
import React from 'react';
import { 
    Building2, 
    FileText, 
    Receipt, 
    CreditCard, 
    FolderKanban, 
    Users,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Sidebar = ({ activeTab, setActiveTab }) => {
    const { t } = useTranslation(); // Initialize translation hook
    
    const menuItems = [
        { 
            id: 'profile', 
            label: t('companies_sidebar.company_profile'), 
            icon: Building2 
        },
        { 
            id: 'quotation', 
            label: t('companies_sidebar.quotations'), 
            icon: FileText 
        },
        { 
            id: 'invoice', 
            label: t('companies_sidebar.invoices'), 
            icon: Receipt 
        },
        { 
            id: 'payment', 
            label: t('companies_sidebar.payments'), 
            icon: CreditCard 
        },
        { 
            id: 'project', 
            label: t('companies_sidebar.projects'), 
            icon: FolderKanban 
        },
        { 
            id: 'contact', 
            label: t('companies_sidebar.contacts'), 
            icon: Users 
        },
    ];

    return (
        <div className="w-64 bg-[#054748] text-white flex flex-col shadow-lg h-screen sticky top-0">
            {/* Logo/Header Sidebar */}
            <div className="p-6 border-b border-[#0a5d5e]">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-[#054748]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">
                            {t('companies_sidebar.company')}
                        </h2>
                        <p className="text-sm text-[#9ec8c9]">
                            {t('companies_sidebar.dashboard')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? 'bg-white text-gray-900 shadow-md' 
                                    : 'text-[#c3dfe0] hover:bg-[#0a5d5e] hover:text-white'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-[#054748]' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer Sidebar */}
            <div className="p-4 border-t border-[#0a5d5e]">
                <Link 
                    href="/companies"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#0a5d5e] rounded-lg hover:bg-[#0c6e6f] transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('companies_sidebar.back_to_companies')}</span>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;