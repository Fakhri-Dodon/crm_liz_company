import { useEffect, useState } from "react";
import HeaderLayout from "@/Layouts/HeaderLayout";
import TableLayout from "@/Layouts/TableLayout";
import leadsService from "@/services/leadsService";
import LeadModal from "@/Components/LeadModal";

export default function LeadsIndex() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [search, setSearch] = useState("");

  const columns = [
    { key: "company_name", label: "Company Name" },
    { key: "address", label: "Address" },
    { key: "contact_person", label: "Contact Person" },
    {
      key: "email",
      label: "Email & Phone",
      render: (_, row) => (
        <div>
          <div>{row.email}</div>
          <div className="text-gray-500 text-sm">{row.phone}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`inline-block px-3 py-1 rounded text-sm font-medium ${
            value === "new"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await leadsService.getAll();
      setLeads(res.data);
    } catch (err) {
      console.error("Fetch leads failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= CRUD =================
  const handleAdd = () => {
    setSelectedLead(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedLead(row);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (selectedLead) {
        await leadsService.update(selectedLead.id, payload);
      } else {
        await leadsService.create(payload);
      }
      setModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error("Save lead failed:", err);
    }
  };

  const handleDelete = async (row) => {
    if (!confirm("Yakin ingin menghapus lead ini?")) return;

    try {
      await leadsService.delete(row.id);
      fetchLeads();
    } catch (err) {
      console.error("Delete lead failed:", err);
    }
  };

  // ================= SEARCH =================
  const filteredLeads = leads.filter((lead) =>
    lead.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <HeaderLayout
        title="Leads"
        subtitle="Daftar leads yang masuk ke CRM"
      />

      {/* ACTION BAR */}
      <div className="px-8 mt-6 mb-4 flex items-center justify-between">
        {/* SEARCH */}
        <select
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Company</option>
          {[...new Set(leads.map((l) => l.company_name))].map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>

        {/* ADD BUTTON */}
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Lead
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="p-8 text-gray-500">Loading data...</div>
      ) : (
        <TableLayout
          columns={columns}
          data={filteredLeads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showAction={true}
        />
      )}

      {/* MODAL */}
      <LeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedLead}
      />
    </>
  );
}
