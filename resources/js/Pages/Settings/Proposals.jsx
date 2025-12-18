import React from 'react';
import SettingsLayout from '@/Layouts/SettingsLayout';
import ProposalSettings from '@/components/settings/ProposalSettings';

export default function LeadsPage() {
    return (
        <SettingsLayout>
            <div className="bg-white rounded-lg shadow-sm p-8 min-h-screen">
                <ProposalSettings />
            </div>
        </SettingsLayout>
    );
}