import React, { useState } from 'react';
import { 
    Hash, FileDigit, Globe, MapPin, Phone, Mail,
    Building, Landmark, Calendar, User, Tag, Info, ChevronDown, ChevronUp
} from 'lucide-react';

const ProfileTable = ({ data }) => {
    const [showMore, setShowMore] = useState(false);
    const [tooltip, setTooltip] = useState({ show: false, content: '', position: { x: 0, y: 0 } });

    const profileFields = [
        {
            icon: Hash,
            label: 'Kode Klien',
            value: data.client_code,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            icon: Tag,
            label: 'Tipe Klien',
            value: data.client_type?.name,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600'
        },
        {
            icon: FileDigit,
            label: 'NIB',
            value: data.nib,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
        },
        {
            icon: FileDigit,
            label: 'VAT Number',
            value: data.vat_number,
            bgColor: 'bg-pink-50',
            iconColor: 'text-pink-600'
        },
        {
            icon: Globe,
            label: 'Website',
            value: data.website,
            bgColor: 'bg-cyan-50',
            iconColor: 'text-cyan-600'
        },
        {
            icon: Building,
            label: 'Kota',
            value: data.city,
            bgColor: 'bg-orange-50',
            iconColor: 'text-orange-600'
        },
        {
            icon: Landmark,
            label: 'Provinsi',
            value: data.province,
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600'
        },
        {
            icon: MapPin,
            label: 'Negara',
            value: data.country,
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600'
        },
        {
            icon: FileDigit,
            label: 'Kode Pos',
            value: data.postal_code,
            bgColor: 'bg-teal-50',
            iconColor: 'text-teal-600'
        },
        {
            icon: Calendar,
            label: 'Klien Sejak',
            value: data.client_since ? new Date(data.client_since).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : 'N/A',
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-600'
        },
        {
            icon: User,
            label: 'Kontak Utama',
            value: data.primary_contact?.name,
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600'
        },
        {
            icon: Mail,
            label: 'Email Kontak',
            value: data.primary_contact?.email,
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-600'
        },
        {
            icon: Phone,
            label: 'Telepon Kontak',
            value: data.primary_contact?.phone,
            bgColor: 'bg-violet-50',
            iconColor: 'text-violet-600'
        },
        {
            icon: User,
            label: 'Jabatan',
            value: data.primary_contact?.position,
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600'
        }
    ];

    // Field yang ditampilkan pertama kali
    const visibleFields = showMore ? profileFields : profileFields.slice(0, 6);

    const handleMouseEnter = (e, content) => {
        if (content && content.length > 25) {
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
        if (!text || text === 'N/A') return <span className="text-gray-500">N/A</span>;
        
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
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Profil Perusahaan</h2>
                <p className="text-sm md:text-base text-gray-600">Informasi detail perusahaan</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {visibleFields.map((field, index) => {
                    const Icon = field.icon;
                    const fieldValue = field.value || 'N/A';
                    
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
                                        <TruncatedText text={fieldValue} maxLength={field.label === 'Website' ? 25 : 20} />
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
                            <span>Tampilkan Lebih Sedikit</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            <span>Tampilkan Semua ({profileFields.length - 6} lagi)</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Additional Information */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Informasi Tambahan</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                            <p className="text-xs md:text-sm text-gray-600">Dibuat Pada</p>
                            <p className="text-sm md:text-base font-medium">
                                {data.created_at ? new Date(data.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs md:text-sm text-gray-600">Status</p>
                            <span className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${
                                data.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {data.is_active ? 'Aktif' : 'Non-Aktif'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTable;