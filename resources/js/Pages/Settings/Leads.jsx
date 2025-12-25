import React from 'react';
import LeadSettings from '@/Components/Settings/LeadSettings';
import SettingsLayout from '@/Layouts/SettingsLayout';

export default function LeadsPage() {
    return (
        <SettingsLayout>
            <div className="bg-white rounded-lg shadow-sm p-8 min-h-screen">
                <LeadSettings />
            </div>
        </SettingsLayout>
    );
}