import React from 'react';
import { 
    Hash, 
    FileDigit, 
    Globe, 
    MapPin, 
    Phone, 
    Mail,
    Building,
    Landmark,
    Calendar,
    User,
    Tag
} from 'lucide-react';

const ProfileTable = ({ data }) => {
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
                month: 'long',
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

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Profil Perusahaan</h2>
                <p className="text-gray-600">Informasi detail perusahaan</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileFields.map((field, index) => {
                    const Icon = field.icon;
                    const fieldValue = field.value || 'N/A';
                    
                    return (
                        <div 
                            key={index} 
                            className={`${field.bgColor} p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${field.iconColor} bg-white`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500">{field.label}</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-1 break-words">
                                        {fieldValue}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Tambahan</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Dibuat Pada</p>
                            <p className="font-medium">
                                {data.created_at ? new Date(data.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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