import React from 'react';
import InvoiceSettings from '@/Components/Settings/InvoiceSettings';
import SettingsLayout from '@/Layouts/SettingsLayout';

export default function InvoicesPage() {
    return (
        <SettingsLayout>
            <div className="bg-white rounded-lg shadow-sm p-8 min-h-screen">
                <InvoiceSettings />
            </div>
        </SettingsLayout>
    );
}
