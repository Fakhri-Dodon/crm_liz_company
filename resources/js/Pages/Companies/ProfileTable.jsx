// resources/js/Pages/Companies/ProfileTable.jsx
import React, { useState } from 'react';
import { 
    Hash, FileDigit, Globe, MapPin, Phone, Mail,
    Building, Landmark, Calendar, User, Tag, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const ProfileTable = ({ data }) => {
    const { t } = useTranslation(); // Initialize translation hook
    const [showMore, setShowMore] = useState(false);
    const [tooltip, setTooltip] = useState({ show: false, content: '', position: { x: 0, y: 0 } });

    const profileFields = [
        {
            icon: Hash,
            label: t('profile_table.client_code'),
            value: data.client_code,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            icon: Tag,
            label: t('profile_table.client_type'),
            value: data.client_type?.name,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600'
        },
        {
            icon: FileDigit,
            label: t('profile_table.nib'),
            value: data.nib,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
        {
            icon: FileDigit,
            label: t('profile_table.vat_number'),
            value: data.vat_number,
            bgColor: 'bg-pink-50',
            iconColor: 'text-pink-600'
        },
        {
            icon: Globe,
            label: t('profile_table.website'),
            value: data.website,
            bgColor: 'bg-cyan-50',
            iconColor: 'text-cyan-600'
        },
        {
            icon: Building,
            label: t('profile_table.city'),
            value: data.city,
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600'
        },
        {
            icon: Landmark,
            label: t('profile_table.province'),
            value: data.province,
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600'
        },
        {
            icon: MapPin,
            label: t('profile_table.country'),
            value: data.country,
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600'
        },
        {
            icon: FileDigit,
            label: t('profile_table.postal_code'),
            value: data.postal_code,
            bgColor: 'bg-teal-50',
            iconColor: 'text-teal-600'
        },
        {
            icon: Calendar,
            label: t('profile_table.client_since'),
            value: data.client_since ? new Date(data.client_since).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : t('profile_table.not_available'),
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-600'
        },
        {
            icon: User,
            label: t('profile_table.primary_contact'),
            value: data.primary_contact?.name,
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600'
        },
        {
            icon: Mail,
            label: t('profile_table.contact_email'),
            value: data.primary_contact?.email,
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-600'
        },
        {
            icon: Phone,
            label: t('profile_table.contact_phone'),
            value: data.primary_contact?.phone,
            bgColor: 'bg-violet-50',
            iconColor: 'text-violet-600'
        },
        {
            icon: User,
            label: t('profile_table.position'),
            value: data.primary_contact?.position,
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600'
        }
    ];

    // Field yang ditampilkan pertama kali
    const visibleFields = showMore ? profileFields : profileFields.slice(0, 6);

    const handleMouseEnter = (e, content) => {
        if (content && content.length > 25 && content !== t('profile_table.not_available')) {
            setTooltip({
                show: true,
                content,
                position: { x: e.clientX, y: e.clientY }
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltip({ show: false, content: '', position: { x: 0, y: 0 } });
    };

    const TruncatedText = ({ text, maxLength = 20 }) => {
        const notAvailable = t('profile_table.not_available');
        if (!text || text === notAvailable) return <span className="text-gray-500">{notAvailable}</span>;
        
        const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        
        return (
            <span 
                className={text.length > maxLength ? 'cursor-help' : ''}
                onMouseEnter={(e) => handleMouseEnter(e, text)}
                onMouseLeave={handleMouseLeave}
            >
                {displayText}
            </span>
        );
    };

    // Format date for "Dibuat Pada"
    const formatCreatedAt = (dateString) => {
        if (!dateString) return t('profile_table.not_available');
        
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status text and class
    const getStatusInfo = () => {
        const status = data.is_active ? 'active' : 'inactive';
        return {
            text: t(`profile_table.status_${status}`),
            className: status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
        };
    };

    const statusInfo = getStatusInfo();

    return (
        <div>
            {tooltip.show && (
                <div 
                    className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg"
                    style={{ left: tooltip.position.x + 10, top: tooltip.position.y + 10 }}
                >
                    {tooltip.content}
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    {t('profile_table.company_profile')}
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                    {t('profile_table.company_details')}
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {visibleFields.map((field, index) => {
                    const Icon = field.icon;
                    const fieldValue = field.value || t('profile_table.not_available');
                    
                    return (
                        <div 
                            key={index} 
                            className={`${field.bgColor} p-3 md:p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${field.iconColor} bg-white flex-shrink-0`}>
                                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
                                        {field.label}
                                    </p>
                                    <p className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 mt-1 break-words">
                                        <TruncatedText text={fieldValue} maxLength={field.label === t('profile_table.website') ? 25 : 20} />
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Show More/Less Button */}
            <div className="mt-4 flex justify-center">
                <button 
                    onClick={() => setShowMore(!showMore)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    {showMore ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            <span>{t('profile_table.show_less')}</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            <span>{t('profile_table.show_more', { count: profileFields.length - 6 })}</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Additional Information */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                    {t('profile_table.additional_info')}
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <p className="text-xs md:text-sm text-gray-600">
                                {t('profile_table.created_at')}
                            </p>
                            <p className="text-sm md:text-base font-medium">
                                {formatCreatedAt(data.created_at)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs md:text-sm text-gray-600">
                                {t('profile_table.status')}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${statusInfo.className}`}>
                                {statusInfo.text}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTable;