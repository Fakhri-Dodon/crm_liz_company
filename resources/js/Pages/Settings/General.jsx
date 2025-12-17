import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import GeneralSettings from '@/components/settings/GeneralSettings';
import SettingsLayout from '@/Layouts/SettingsLayout';

export default function GeneralPage() {
    const queryClient = useQueryClient();

    const { data: config, isLoading } = useQuery({
        queryKey: ['appConfig'],
        queryFn: async () => {
            const result = await api.entities.AppConfig.list();
            return result[0] || {}; 
        }
    });

    const handleConfigUpdate = () => {
        queryClient.invalidateQueries(['appConfig']);
    };

    return (
        <SettingsLayout>
          <div className="bg-white rounded-lg shadow-sm p-8 min-h-screen">
              <GeneralSettings config={config} onUpdate={handleConfigUpdate} />
          </div>
        </SettingsLayout>
    );
}