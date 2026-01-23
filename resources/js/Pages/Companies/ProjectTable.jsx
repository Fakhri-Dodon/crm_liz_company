// resources/js/Pages/Companies/ProjectTable.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
    FolderKanban,
    Calendar,
    Clock,
    CheckCircle,
    PlayCircle,
    MoreVertical,
    Edit2,
    Trash2,
    XCircle,
    PauseCircle,
    Search
} from "lucide-react";
import { useTranslation } from "react-i18next";
import SubModuleTableLayout, { ExpandableTextCell, ExpandableAmountCell } from '@/Layouts/SubModuleTableLayout';

const ProjectTable = ({ data: initialData, onEdit, onDelete, auth_permissions }) => {
    const { t } = useTranslation();
    
    // State untuk data projects
    const [data, setData] = useState(initialData || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const perms = auth_permissions || {};
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    // Update data ketika initialData berubah
    useEffect(() => {
        setData(initialData || []);
    }, [initialData]);

    // Map status untuk tampilan
    const mapStatusForDisplay = (status) => {
        if (!status) return "pending";

        const statusLower = status.toLowerCase();

        if (["progress", "active", "on_progress", "in_progress"].includes(statusLower)) {
            return "in_progress";
        }
        if (["done", "finished", "completed"].includes(statusLower)) {
            return "completed";
        }
        if (["canceled", "cancelled", "rejected"].includes(statusLower)) {
            return "cancelled";
        }
        if (["delayed", "overdue", "draft", "new", "pending"].includes(statusLower)) {
            return "pending";
        }

        return "pending";
    };

    const formatDate = (dateString) => {
        if (!dateString) return t("project_table.not_available");
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch (error) {
            return dateString;
        }
    };

    const calculateDaysLeft = (deadline) => {
        if (!deadline) return 0;
        try {
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    };

    // Status badge component
    const getStatusBadge = (originalStatus) => {
        const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap";
        const displayStatus = mapStatusForDisplay(originalStatus);

        switch (displayStatus) {
            case "in_progress":
                return (
                    <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
                        <PlayCircle className="w-3 h-3 mr-1" />
                        {t("project_table.status_in_progress")}
                    </span>
                );
            case "completed":
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("project_table.status_completed")}
                    </span>
                );
            case "pending":
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                        <PauseCircle className="w-3 h-3 mr-1" />
                        {t("project_table.status_pending")}
                    </span>
                );
            case "cancelled":
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800`}>
                        <XCircle className="w-3 h-3 mr-1" />
                        {t("project_table.status_cancelled")}
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
                        {originalStatus || t("project_table.status_unknown")}
                    </span>
                );
        }
    };

    // Days left text component
    const DaysLeftCell = ({ project }) => {
        const daysLeft = calculateDaysLeft(project.deadline);
        const displayStatus = mapStatusForDisplay(project.status);

        const getText = () => {
            if (displayStatus === "completed") {
                return t("project_table.completed");
            }
            if (displayStatus === "cancelled") {
                return t("project_table.cancelled");
            }

            if (daysLeft !== null && daysLeft !== undefined) {
                if (daysLeft < 0) return t("project_table.days_late", { days: Math.abs(daysLeft) });
                if (daysLeft === 0) return t("project_table.today");
                if (daysLeft === 1) return t("project_table.tomorrow");
                return t("project_table.days_left", { days: daysLeft });
            }

            return t("project_table.not_available");
        };

        const getColor = () => {
            if (displayStatus === "completed") return "text-green-800 bg-green-100";
            if (displayStatus === "cancelled") return "text-red-800 bg-red-100";

            if (daysLeft !== null && daysLeft !== undefined) {
                if (daysLeft < 0) return "text-red-800 bg-red-100";
                if (daysLeft <= 7) return "text-yellow-800 bg-yellow-100";
                return "text-green-800 bg-green-100";
            }

            return "text-gray-800 bg-gray-100";
        };

        return (
            <span className={`px-2 py-1 rounded text-xs ${getColor()}`}>
                {getText()}
            </span>
        );
    };

    const filterData = () => {
        return data
            .filter(project => {
                const matchesSearch = searchTerm === '' || 
                    (project.project_description && project.project_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (project.note && project.note.toLowerCase().includes(searchTerm.toLowerCase()));
                
                if (statusFilter === 'all') return matchesSearch;
                
                const normalizedStatus = mapStatusForDisplay(project.status);
                return matchesSearch && normalizedStatus === statusFilter;
            })
            .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0));
    };

    const filteredData = filterData();

    // Calculate statistics
    const totalProjects = data.length;
    const completedCount = data.filter(p => mapStatusForDisplay(p.status) === "completed").length;
    const inProgressCount = data.filter(p => mapStatusForDisplay(p.status) === "in_progress").length;
    const pendingCount = data.filter(p => mapStatusForDisplay(p.status) === "pending").length;
    const cancelledCount = data.filter(p => mapStatusForDisplay(p.status) === "cancelled").length;

    // Prepare columns untuk SubModuleTableLayout
    const columns = useMemo(() => [
        {
            key: 'project_description',
            label: t('project_table.project_description'),
            width: '180px',
            render: (value) => (
                <ExpandableTextCell 
                    text={value || t("project_table.no_description")}
                    maxLength={30}
                    className="text-xs"
                />
            )
        },
        {
            key: 'start_date',
            label: t('project_table.start_date'),
            width: '100px',
            className: 'hidden lg:table-cell',
            render: (value) => (
                <div className="text-gray-600 text-xs">
                    {formatDate(value)}
                </div>
            )
        },
        {
            key: 'deadline',
            label: t('project_table.deadline'),
            width: '100px',
            className: 'hidden lg:table-cell',
            render: (value) => (
                <div className="text-gray-600 text-xs">
                    {formatDate(value)}
                </div>
            )
        },
        {
            key: 'days_left',
            label: t('project_table.time_left'),
            width: '110px',
            render: (value, row) => <DaysLeftCell project={row} />
        },
        {
            key: 'status',
            label: t('project_table.status'),
            width: '110px',
            render: (value) => getStatusBadge(value)
        },
        {
            key: 'note',
            label: t('project_table.note'),
            width: '140px',
            render: (value) => (
                <ExpandableTextCell 
                    text={value || t("project_table.not_available")}
                    maxLength={25}
                    className="text-gray-600 text-xs"
                />
            )
        }
    ], [t]);

    // Handle edit untuk SubModuleTableLayout
    const handleEdit = (row) => {
        if (onEdit && typeof onEdit === 'function') {
            onEdit(row);
        }
    };

    // Handle delete untuk SubModuleTableLayout
    const handleDelete = (row) => {
        if (onDelete && typeof onDelete === 'function') {
            onDelete(row);
        }
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('project_table.no_projects_found')}
                </h3>
                <p className="text-gray-600">
                    {t('project_table.no_projects_message')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h2 className="font-bold text-gray-900 text-base">
                        {t('project_table.title')}
                    </h2>
                    <p className="text-gray-600 text-xs">
                        {t('project_table.project_count', {
                            count: data.length,
                            filteredCount: filteredData.length
                        })}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                            type="text"
                            placeholder={t('project_table.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">{t('project_table.all_status')}</option>
                        <option value="pending">{t('project_table.status_pending')}</option>
                        <option value="in_progress">{t('project_table.status_in_progress')}</option>
                        <option value="completed">{t('project_table.status_completed')}</option>
                        <option value="cancelled">{t('project_table.status_cancelled')}</option>
                    </select>
                </div>
            </div>

            {/* Statistics Cards */}
            {data.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('project_table.total_projects')}
                        </div>
                        <div className="font-bold text-gray-900 text-sm">
                            {totalProjects}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('project_table.completed')}
                        </div>
                        <div className="font-bold text-green-600 text-sm">
                            {completedCount}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('project_table.in_progress')}
                        </div>
                        <div className="font-bold text-blue-600 text-sm">
                            {inProgressCount}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="text-gray-600 text-xs mb-1">
                            {t('project_table.pending')}
                        </div>
                        <div className="font-bold text-yellow-600 text-sm">
                            {pendingCount}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content menggunakan SubModuleTableLayout */}
            <SubModuleTableLayout
                columns={columns}
                data={filteredData}
                onEdit={canUpdate ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                showAction={canUpdate || canDelete}
                tableTitle=""
                showHeader={false}
                showFooter={true}
                compactMode={true}
                rowHeight="h-11"
            />
        </div>
    );
};

export default ProjectTable;