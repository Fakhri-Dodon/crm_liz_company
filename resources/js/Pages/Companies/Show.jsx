import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import Sidebar from './Sidebar';
import CompanyHeader from './CompanyHeader';
import ProfileTable from './ProfileTable';
import QuotationTable from './QuotationTable';
import InvoiceTable from './InvoiceTable';
import PaymentTable from './PaymentTable';
import ProjectTable from './ProjectTable';
import ContactTable from './ContactTable';
import ProjectModal from '@/Components/Project/ProjectModal';
import HeaderLayout from '@/Layouts/HeaderLayout';
import { Trash2 } from 'lucide-react';
import axios from 'axios';

const Show = ({ company, quotations, invoices, payments, projects, contacts, statistics, grouped_quotations }) => {
    const { props } = usePage();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [modalMode, setModalMode] = useState('create'); // 'create' atau 'edit'
    
    // State untuk contacts yang bisa diupdate
    const [contactData, setContactData] = useState(contacts || []);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    
    console.log('========== SHOW PAGE DATA ==========');
    console.log('Company:', company);
    console.log('Contacts data received:', contacts);
    console.log('Projects data:', projects);
    console.log('===================================');

    // Setup axios defaults
    useEffect(() => {
        axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        axios.defaults.withCredentials = true;
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
        }
    }, []);

    // Debug log untuk memastikan data diterima
    useEffect(() => {
        if (!company || !company.id) {
            console.error('ERROR: Company data is missing!');
        } else {
            console.log('SUCCESS: Company data received:', {
                id: company.id,
                name: company.client_code,
                contact_person: company.contact_person,
                contacts_count: contacts?.length || 0
            });
        }
        
        // Update contactData ketika contacts berubah
        if (contacts) {
            setContactData(contacts);
        }
    }, [company, contacts]);

    // Function untuk fetch contacts dari API
    const fetchContacts = async () => {
        if (!company?.id) return;
        
        setIsLoadingContacts(true);
        try {
            const response = await axios.get(`/companies/${company.id}/contacts`);
            console.log('Fetched contacts:', response.data);
            
            if (response.data.success) {
                setContactData(response.data.data);
            } else {
                console.error('Failed to fetch contacts:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            // Fallback ke data dari props jika API gagal
            setContactData(contacts || []);
        } finally {
            setIsLoadingContacts(false);
        }
    };

    // Load contacts saat tab contact aktif
    useEffect(() => {
        if (activeTab === 'contact' && company?.id) {
            fetchContacts();
        }
    }, [activeTab, company?.id]);

    // Toast notification function
    const showToast = (message, type = 'success') => {
        // Hapus toast yang ada sebelumnya
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `custom-toast fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4">
                    ✕
                </button>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    };

    // Function untuk handle edit project
    const handleProjectEdit = (project) => {
        console.log('Editing project:', project);
        setSelectedProject(project);
        setModalMode('edit');
        setShowProjectModal(true);
    };

    // Function untuk handle delete project
    const handleProjectDelete = (project) => {
        console.log('Deleting project:', project);
        setSelectedProject(project);
        setShowDeleteModal(true);
    };

    // Function untuk confirm delete project
    const confirmProjectDelete = () => {
        if (selectedProject) {
            router.delete(route('projects.destroy', selectedProject.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedProject(null);
                    showToast('Project deleted successfully!', 'success');
                },
                onError: () => {
                    showToast('Failed to delete project!', 'error');
                }
            });
        }
    };

    // Function untuk menangani update contacts
    const handleContactsUpdate = () => {
        console.log('Refreshing contacts data...');
        fetchContacts();
        showToast('Contacts updated successfully!', 'success');
    };

    // Function untuk menambah project baru
    const handleAddProject = () => {
        setSelectedProject(null);
        setModalMode('create');
        setShowProjectModal(true);
    };

    // Jika company tidak ada, tampilkan error message
    if (!company || !company.id) {
        return (
            <HeaderLayout>
                <Head title="Error - Company Not Found" />
                <div className="flex justify-center items-center h-screen">
                    <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h1>
                        <p className="text-gray-600 mb-6">
                            The company you're looking for doesn't exist or you don't have permission to access it.
                        </p>
                        <button
                            onClick={() => router.visit(route('companies.index'))}
                            className="px-6 py-3 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors font-medium"
                        >
                            Back to Companies List
                        </button>
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Debug Info:</p>
                            <p className="text-xs text-gray-400 mt-1">
                                URL: {window.location.href}<br/>
                                Route: companies.show<br/>
                                Received Props: {Object.keys(props).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            </HeaderLayout>
        );
    }

    // Data untuk ditampilkan
    const displayData = {
        company: {
            ...company,
            // Pastikan ada data contact person
            contact_person: company.contact_person || company.primary_contact?.name || 'N/A',
            contact_email: company.contact_email || company.primary_contact?.email || 'N/A',
            contact_phone: company.contact_phone || company.primary_contact?.phone || 'N/A',
            contact_position: company.contact_position || company.primary_contact?.position || 'N/A'
        },
        statistics: statistics || {},
        quotations: quotations || [],
        invoices: invoices || [],
        payments: payments || [],
        projects: projects || [],
        contacts: contactData, // Gunakan state contactData yang bisa diupdate
        grouped_quotations: grouped_quotations || []
    };

    // Render konten berdasarkan tab aktif
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#054748]"></div>
                    <span className="ml-3 text-gray-600">Memuat data...</span>
                </div>
            );
        }

        switch (activeTab) {
            case 'profile':
                return <ProfileTable data={displayData.company} />;
            case 'quotation':
                return (
                    <QuotationTable 
                        data={displayData.quotations} 
                        groupedData={displayData.grouped_quotations}
                        companyId={displayData.company.id}
                    />
                );
            case 'invoice':
                return <InvoiceTable data={displayData.invoices} />;
            case 'payment':
                return <PaymentTable data={displayData.payments} />;
            case 'project':
                return (
                    <ProjectTable 
                        data={displayData.projects} 
                        onEdit={handleProjectEdit}
                        onDelete={handleProjectDelete}
                        onAdd={handleAddProject}
                    />
                );
            case 'contact':
                return (
                    <ContactTable 
                        contacts={displayData.contacts}
                        companyId={displayData.company.id}
                        onUpdate={handleContactsUpdate}
                        isLoading={isLoadingContacts}
                    />
                );
            default:
                return <ProfileTable data={displayData.company} />;
        }
    };

    // Fungsi untuk mendapatkan jumlah item berdasarkan tab
    const getItemCount = () => {
        switch (activeTab) {
            case 'profile':
                return 1;
            case 'quotation':
                return displayData.quotations?.length || 0;
            case 'invoice':
                return displayData.invoices?.length || 0;
            case 'payment':
                return displayData.payments?.length || 0;
            case 'project':
                return displayData.projects?.length || 0;
            case 'contact':
                return displayData.contacts?.length || 0;
            default:
                return 0;
        }
    };

    // Fungsi untuk mendapatkan tombol tambah berdasarkan tab
    const renderAddButton = () => {
        switch (activeTab) {
            case 'project':
                return (
                    <button
                        onClick={handleAddProject}
                        className="px-4 py-2 bg-[#054748] text-white rounded-lg hover:bg-[#0a5d5e] transition-colors font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Project
                    </button>
                );
            case 'contact':
                // Tombol Add sudah ada di dalam ContactTable component
                return null;
            default:
                return null;
        }
    };

    return (
        <HeaderLayout>
            <Head title={`${displayData.company.client_code} - Detail Perusahaan`} />
            
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar */}
                <div className="flex-shrink-0">
                    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="p-0">
                        {/* Success Message */}
                        {company && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg mx-6 mt-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-800">Successfully loaded company data</h3>
                                        <p className="text-sm text-green-600 mt-1">
                                            Viewing: <span className="font-bold">{displayData.company.client_code}</span> | 
                                            Contacts: <span className="font-bold">{displayData.contacts?.length || 0}</span> | 
                                            Projects: <span className="font-bold">{displayData.projects?.length || 0}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Company Header */}
                        <div className="px-6">
                            <CompanyHeader 
                                company={displayData.company}
                                activeTab={activeTab}
                                data={displayData}
                                statistics={displayData.statistics}
                            />
                        </div>
                        
                        {/* Content Area */}
                        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 mx-6 p-6">
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 capitalize">
                                        {activeTab === 'profile' ? 'Profil Perusahaan' :
                                         activeTab === 'quotation' ? 'Daftar Quotation' :
                                         activeTab === 'invoice' ? 'Daftar Invoice' :
                                         activeTab === 'payment' ? 'Riwayat Pembayaran' :
                                         activeTab === 'project' ? 'Proyek' : 'Kontak Perusahaan'}
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        {getItemCount()} item{getItemCount() !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {/* Tombol Tambah berdasarkan tab */}
                                {renderAddButton()}
                            </div>
                            
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Modal */}
            {showProjectModal && (
                <ProjectModal
                    show={showProjectModal}
                    onClose={() => {
                        setShowProjectModal(false);
                        setSelectedProject(null);
                    }}
                    projectId={selectedProject?.id}
                    companies={[{
                        id: company.id,
                        name: company.client_code,
                        client_code: company.client_code,
                        city: company.city || ''
                    }]}
                    quotations={quotations || []}
                    statusOptions={[
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'cancelled', label: 'Cancelled' }
                    ]}
                    isEdit={modalMode === 'edit'}
                    title={modalMode === 'edit' ? 'Edit Project' : 'Add Project'}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedProject && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Project</h3>
                                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                                </div>
                            </div>
                            
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete project "{selectedProject.project_description}"?
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedProject(null);
                                    }}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmProjectDelete}
                                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-1"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </HeaderLayout>
    );
};

export default Show;