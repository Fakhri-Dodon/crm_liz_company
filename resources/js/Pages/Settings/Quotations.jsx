import React from 'react';
import QuotationSettings from '@/Components/Settings/QuotationSettings';
import SettingsLayout from '@/Layouts/SettingsLayout';

export default function QuotationsPage() {
    return (
        <SettingsLayout>
            <div className="bg-white rounded-lg shadow-sm p-8 min-h-screen">
                <QuotationSettings />
            </div>
        </SettingsLayout>
    );
}