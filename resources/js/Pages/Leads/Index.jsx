import { useEffect, useState } from 'react';
import leadsService from '@/services/leadsService';

export default function LeadsIndex() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        try {
            const { data } = await leadsService.getAll();
            setLeads(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Leads</h1>

            <table className="w-full border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">Company</th>
                        <th className="p-2 border">Contact</th>
                        <th className="p-2 border">Email</th>
                        <th className="p-2 border">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead.id}>
                            <td className="p-2 border">{lead.company_name}</td>
                            <td className="p-2 border">{lead.contact_person}</td>
                            <td className="p-2 border">{lead.email}</td>
                            <td className="p-2 border">{lead.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
