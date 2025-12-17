import React from 'react';
import UserRoleSettings from '@/components/settings/UserRoleSettings';
import SettingsLayout from '@/Layouts/SettingsLayout';

export default function UserRolesPage() {
    return (
        <SettingsLayout>
          <div className="bg-white rounded-lg shadow-sm p-8 min-h-screen">
              <UserRoleSettings />
          </div>
        </SettingsLayout>
    );
}