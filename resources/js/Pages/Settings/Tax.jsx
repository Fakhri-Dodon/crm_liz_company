import React from 'react';
import TaxSettings from '@/Components/Settings/TaxSettings';
import SettingsLayout from '@/Layouts/SettingsLayout';

export default function TaxsPage() {
    return (
        <SettingsLayout>
            <div className="bg-white rounded-lg shadow-sm p-8 min-h-screen">
                <TaxSettings />
            </div>
        </SettingsLayout>
    );
}