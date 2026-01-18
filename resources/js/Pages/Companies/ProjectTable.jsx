// resources/js/Pages/Companies/ProjectTable.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    FolderKanban,
    Calendar,
    Clock,
    CheckCircle,
    PlayCircle,
    MoreVertical,
    Edit,
    Trash2,
    XCircle,
    PauseCircle,
    X,
    Save,
    Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ProjectTable = ({ data, onEdit, onDelete, auth_permissions }) => {
    const { t } = useTranslation();
    const [actionMenu, setActionMenu] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        project_description: "",
        start_date: "",
        deadline: "",
        status: "pending",
        note: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Refs untuk menangani input dengan lebih baik
    const descriptionTextareaRef = useRef(null);
    const modalRef = useRef(null);

    const perms = auth_permissions || {};

    const canRead = perms.can_read === 1;
    const canCreate = perms.can_create === 1;
    const canUpdate = perms.can_update === 1;
    const canDelete = perms.can_delete === 1;

    // Map status dari database ke 4 status standar untuk form
    const mapStatusForForm = useCallback((status) => {
        if (!status) return "pending";

        const statusLower = status.toLowerCase();

        if (
            ["progress", "active", "on_progress", "in_progress"].includes(
                statusLower
            )
        ) {
            return "in_progress";
        }
        if (["done", "finished", "completed"].includes(statusLower)) {
            return "completed";
        }
        if (["canceled", "cancelled", "rejected"].includes(statusLower)) {
            return "cancelled";
        }
        if (
            ["delayed", "overdue", "draft", "new", "pending"].includes(
                statusLower
            )
        ) {
            return "pending";
        }

        return "pending"; // default
    }, []);

    // Map status dari form ke status yang dikirim ke backend (sesuai kebutuhan backend)
    const mapStatusForBackend = useCallback((formStatus) => {
        const statusMap = {
            in_progress: "in_progress",
            completed: "completed",
            cancelled: "cancelled",
            pending: "pending",
        };
        return statusMap[formStatus] || "pending";
    }, []);

    // Initialize form when editingProject changes
    useEffect(() => {
        if (editingProject) {
            // Map status dari database ke status form (4 opsi)
            const mappedStatus = mapStatusForForm(editingProject.status);

            setFormData({
                project_description: editingProject.project_description || "",
                start_date: editingProject.start_date
                    ? new Date(editingProject.start_date)
                          .toISOString()
                          .split("T")[0]
                    : "",
                deadline: editingProject.deadline
                    ? new Date(editingProject.deadline)
                          .toISOString()
                          .split("T")[0]
                    : "",
                status: mappedStatus,
                note: editingProject.note || "",
            });

            // Clear errors when form is initialized
            setFormErrors({});

            // Delay auto-focus untuk memastikan modal sudah ter-render
            setTimeout(() => {
                if (descriptionTextareaRef.current) {
                    descriptionTextareaRef.current.focus();
                    // Pindahkan cursor ke akhir teks
                    const textLength =
                        descriptionTextareaRef.current.value.length;
                    descriptionTextareaRef.current.setSelectionRange(
                        textLength,
                        textLength
                    );
                }
            }, 50);
        }
    }, [editingProject, mapStatusForForm]);

    // Clean up ketika modal ditutup
    useEffect(() => {
        if (!isEditModalOpen) {
            // Reset hanya saat modal benar-benar ditutup
            setTimeout(() => {
                setFormData({
                    project_description: "",
                    start_date: "",
                    deadline: "",
                    status: "pending",
                    note: "",
                });
                setFormErrors({});
                setIsSubmitting(false);
            }, 300);
        }
    }, [isEditModalOpen]);

    const formatDate = useCallback(
        (dateString) => {
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
        },
        [t]
    );

    const calculateDaysLeft = useCallback((deadline) => {
        if (!deadline) return 0;
        try {
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            return 0;
        }
    }, []);

    // Update getStatusBadge untuk menampilkan status yang sesuai dengan mapping
    const getStatusBadge = useCallback(
        (originalStatus) => {
            const baseClasses =
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";

            // Map original status untuk display
            const displayStatus = mapStatusForForm(originalStatus);

            switch (displayStatus) {
                case "in_progress":
                    return (
                        <span
                            className={`${baseClasses} bg-blue-100 text-blue-800`}
                        >
                            <PlayCircle className="w-3 h-3 mr-1" />
                            {t("project_table.status_in_progress")}
                        </span>
                    );
                case "completed":
                    return (
                        <span
                            className={`${baseClasses} bg-green-100 text-green-800`}
                        >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t("project_table.status_completed")}
                        </span>
                    );
                case "pending":
                    return (
                        <span
                            className={`${baseClasses} bg-yellow-100 text-yellow-800`}
                        >
                            <PauseCircle className="w-3 h-3 mr-1" />
                            {t("project_table.status_pending")}
                        </span>
                    );
                case "cancelled":
                    return (
                        <span
                            className={`${baseClasses} bg-red-100 text-red-800`}
                        >
                            <XCircle className="w-3 h-3 mr-1" />
                            {t("project_table.status_cancelled")}
                        </span>
                    );
                default:
                    return (
                        <span
                            className={`${baseClasses} bg-gray-100 text-gray-800`}
                        >
                            {originalStatus ||
                                t("project_table.status_unknown")}
                        </span>
                    );
            }
        },
        [mapStatusForForm, t]
    );

    const getDaysLeftText = useCallback(
        (daysLeft, status) => {
            const displayStatus = mapStatusForForm(status);

            if (displayStatus === "completed") {
                return t("project_table.completed");
            }
            if (displayStatus === "cancelled") {
                return t("project_table.cancelled");
            }

            if (daysLeft !== null && daysLeft !== undefined) {
                if (daysLeft < 0)
                    return t("project_table.days_late", {
                        days: Math.abs(daysLeft),
                    });
                if (daysLeft === 0) return t("project_table.today");
                if (daysLeft === 1) return t("project_table.tomorrow");
                return t("project_table.days_left", { days: daysLeft });
            }

            if (!daysLeft && typeof daysLeft !== "number") {
                return t("project_table.not_available");
            }

            return t("project_table.not_available");
        },
        [mapStatusForForm, t]
    );

    const getDaysLeftColor = useCallback(
        (daysLeft, status) => {
            const displayStatus = mapStatusForForm(status);

            if (displayStatus === "completed") {
                return "text-green-800 bg-green-100";
            }
            if (displayStatus === "cancelled") {
                return "text-red-800 bg-red-100";
            }

            if (daysLeft !== null && daysLeft !== undefined) {
                if (daysLeft < 0) return "text-red-800 bg-red-100";
                if (daysLeft <= 7) return "text-yellow-800 bg-yellow-100";
                return "text-green-800 bg-green-100";
            }

            return "text-gray-800 bg-gray-100";
        },
        [mapStatusForForm]
    );

    const toggleActionMenu = (index) => {
        setActionMenu(actionMenu === index ? null : index);
    };

    // Handle edit button click
    const handleEditClick = (project) => {
        console.log("Opening edit modal for project:", project);
        setEditingProject(project);
        setIsEditModalOpen(true);
        setActionMenu(null); // Close action menu if open
    };

    // Handle form input change - DIPERBAIKI
    const handleFormChange = useCallback(
        (e) => {
            const { name, value } = e.target;

            // Simpan posisi cursor untuk textarea khususnya
            if (
                name === "project_description" &&
                descriptionTextareaRef.current
            ) {
                const cursorPosition =
                    descriptionTextareaRef.current.selectionStart;

                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                }));

                // Setelah state update, kembalikan cursor position
                setTimeout(() => {
                    if (descriptionTextareaRef.current) {
                        descriptionTextareaRef.current.focus();
                        descriptionTextareaRef.current.setSelectionRange(
                            cursorPosition,
                            cursorPosition
                        );
                    }
                }, 0);
            } else {
                // Untuk input lainnya, langsung update
                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }

            // Clear error for this field when user starts typing
            if (formErrors[name]) {
                setFormErrors((prev) => ({
                    ...prev,
                    [name]: "",
                }));
            }
        },
        [formErrors]
    );

    // Validate form
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.project_description.trim()) {
            errors.project_description = t(
                "project_table.errors.description_required"
            );
        }

        if (!formData.start_date) {
            errors.start_date = t("project_table.errors.start_date_required");
        }

        if (!formData.deadline) {
            errors.deadline = t("project_table.errors.deadline_required");
        } else if (
            formData.start_date &&
            formData.deadline < formData.start_date
        ) {
            errors.deadline = t("project_table.errors.deadline_before_start");
        }

        if (!formData.status) {
            errors.status = t("project_table.errors.status_required");
        }

        return errors;
    }, [formData, t]);

    // Handle form submit
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        console.log("Submitting form data:", formData);

        // Validate form
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            console.error("Form validation errors:", errors);
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare updated project data dengan status yang sudah di-map untuk backend
            const updatedProject = {
                ...editingProject,
                project_description: formData.project_description,
                start_date: formData.start_date,
                deadline: formData.deadline,
                status: mapStatusForBackend(formData.status), // Map ke status backend
                note: formData.note,
            };

            console.log("Calling onEdit with updated project:", updatedProject);

            // Call parent's onEdit if provided
            if (onEdit && typeof onEdit === "function") {
                // Pass the updated project data and a callback for success/failure
                const success = await onEdit(updatedProject);

                if (success) {
                    // Close modal only if parent indicates success
                    setIsEditModalOpen(false);
                    setEditingProject(null);
                    setFormErrors({});
                    console.log("Project edit successful");
                } else {
                    console.error("Parent onEdit callback returned false");
                    // Keep modal open if there was an error
                }
            } else {
                console.warn("onEdit prop not provided or not a function");
                // If no onEdit prop, just close the modal
                setIsEditModalOpen(false);
                setEditingProject(null);
            }
        } catch (error) {
            console.error("Error in form submission:", error);
            setFormErrors({
                submit: t("project_table.errors.submission_failed"),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close
    const handleModalClose = () => {
        if (!isSubmitting) {
            setIsEditModalOpen(false);
            setEditingProject(null);
            setFormErrors({});
        }
    };

    // Mobile Card View
    const MobileCardView = useCallback(
        ({ project, index }) => {
            const daysLeft =
                project.days_left !== undefined
                    ? project.days_left
                    : calculateDaysLeft(project.deadline);

            return (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start space-x-3">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <FolderKanban className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                                            {index + 1}.{" "}
                                            {project.project_description?.substring(
                                                0,
                                                60
                                            ) ||
                                                t(
                                                    "project_table.no_description"
                                                )}
                                            {project.project_description
                                                ?.length > 60 && "..."}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-xs text-gray-500 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {t("project_table.start")}:{" "}
                                                {formatDate(project.start_date)}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {t("project_table.deadline")}:{" "}
                                                {formatDate(project.deadline)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() =>
                                                toggleActionMenu(index)
                                            }
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        {actionMenu === index &&
                                            /* Cek Wrapper: Pastikan punya salah satu akses agar kotaknya muncul */
                                            (canUpdate || canDelete) && (
                                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                    {/* Cek 1: Hanya tampilkan tombol Edit jika canUpdate true */}
                                                    {canUpdate && (
                                                        <button
                                                            onClick={() =>
                                                                handleEditClick(
                                                                    project
                                                                )
                                                            }
                                                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                        >
                                                            <Edit className="w-3 h-3 mr-2" />
                                                            {t(
                                                                "project_table.edit"
                                                            )}
                                                        </button>
                                                    )}

                                                    {/* Cek 2: Hanya tampilkan tombol Delete jika canDelete true */}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => {
                                                                if (
                                                                    onDelete &&
                                                                    typeof onDelete ===
                                                                        "function"
                                                                ) {
                                                                    onDelete(
                                                                        project
                                                                    );
                                                                }
                                                                setActionMenu(
                                                                    null
                                                                );
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center"
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-2" />
                                                            {t(
                                                                "project_table.delete"
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <div
                                        className={`px-2 py-1 rounded text-xs ${getDaysLeftColor(
                                            daysLeft,
                                            project.status
                                        )}`}
                                    >
                                        {getDaysLeftText(
                                            daysLeft,
                                            project.status
                                        )}
                                    </div>
                                    {getStatusBadge(project.status)}
                                </div>

                                {project.note && (
                                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                        <span className="font-medium">
                                            {t("project_table.note_label")}:
                                        </span>{" "}
                                        {project.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        },
        [
            actionMenu,
            calculateDaysLeft,
            formatDate,
            getDaysLeftColor,
            getDaysLeftText,
            getStatusBadge,
            onDelete,
            t,
        ]
    );

    // Edit Modal Component - DIPERBAIKI TOTAL
    const EditProjectModal = () => {
        if (!isEditModalOpen || !editingProject) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div
                    ref={modalRef}
                    className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Edit className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t("project_table.edit_project_title") ||
                                        "Edit Proyek"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {t("project_table.edit_project_subtitle") ||
                                        "Ubah detail proyek"}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleModalClose}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Form */}
                    <form onSubmit={handleFormSubmit} className="p-6">
                        <div className="space-y-4">
                            {/* Project Description - DIPERBAIKI DENGAN CONTROLLED INPUT */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("project_table.project_description") ||
                                        "Deskripsi Proyek"}
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <textarea
                                    ref={descriptionTextareaRef}
                                    name="project_description"
                                    value={formData.project_description}
                                    onChange={handleFormChange}
                                    onBlur={(e) => {
                                        // Hanya handle blur untuk validasi, jangan ganggu fokus
                                        if (
                                            !e.target.value.trim() &&
                                            !formErrors.project_description
                                        ) {
                                            setFormErrors((prev) => ({
                                                ...prev,
                                                project_description: t(
                                                    "project_table.errors.description_required"
                                                ),
                                            }));
                                        }
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        formErrors.project_description
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    rows="4"
                                    placeholder={
                                        t(
                                            "project_table.description_placeholder"
                                        ) || "Masukkan deskripsi proyek..."
                                    }
                                    required
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                    spellCheck="true"
                                    data-lpignore="true"
                                    data-form-type="other"
                                />
                                {formErrors.project_description && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {formErrors.project_description}
                                    </p>
                                )}
                                <div className="mt-1 text-xs text-gray-500">
                                    {formData.project_description.length}{" "}
                                    karakter
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("project_table.start_date") ||
                                            "Tanggal Mulai"}
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleFormChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            formErrors.start_date
                                                ? "border-red-300"
                                                : "border-gray-300"
                                        }`}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    {formErrors.start_date && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.start_date}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("project_table.deadline") ||
                                            "Deadline"}
                                        <span className="text-red-500 ml-1">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleFormChange}
                                        min={formData.start_date}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            formErrors.deadline
                                                ? "border-red-300"
                                                : "border-gray-300"
                                        }`}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    {formErrors.deadline && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.deadline}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Status - Hanya 4 opsi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("project_table.status") || "Status"}
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        formErrors.status
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="pending">
                                        {t("project_table.status_pending") ||
                                            "Pending"}
                                    </option>
                                    <option value="in_progress">
                                        {t(
                                            "project_table.status_in_progress"
                                        ) || "In Progress"}
                                    </option>
                                    <option value="completed">
                                        {t("project_table.status_completed") ||
                                            "Completed"}
                                    </option>
                                    <option value="cancelled">
                                        {t("project_table.status_cancelled") ||
                                            "Cancelled"}
                                    </option>
                                </select>
                                {formErrors.status && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {formErrors.status}
                                    </p>
                                )}
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t("project_table.note") || "Catatan"}
                                </label>
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    rows="3"
                                    placeholder={
                                        t("project_table.note_placeholder") ||
                                        "Masukkan catatan tambahan..."
                                    }
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Submit error */}
                        {formErrors.submit && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">
                                    {formErrors.submit}
                                </p>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleModalClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {t("project_table.cancel") || "Batal"}
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t("project_table.saving") ||
                                            "Menyimpan..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {t("project_table.save_changes") ||
                                            "Simpan Perubahan"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Title for Project Table */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t("project_table.title") || "Daftar Proyek"}
            </h2>

            {/* Mobile View */}
            <div className="sm:hidden">
                {data.map((project, index) => (
                    <MobileCardView
                        key={project.id || index}
                        project={project}
                        index={index}
                    />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t("project_table.no")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t("project_table.project_description")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t("project_table.start_date")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t("project_table.deadline")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t("project_table.time_left")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t("project_table.status")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    {t("project_table.note")}
                                </th>
                                { (canUpdate || canDelete) && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {t("project_table.actions")}
                                    </th>
                                )}                                
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((project, index) => {
                                const daysLeft =
                                    project.days_left !== undefined
                                        ? project.days_left
                                        : calculateDaysLeft(project.deadline);

                                return (
                                    <tr
                                        key={project.id || index}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-3 max-w-[300px]">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {project.project_description ||
                                                    t(
                                                        "project_table.not_available"
                                                    )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(project.start_date)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(project.deadline)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${getDaysLeftColor(
                                                    daysLeft,
                                                    project.status
                                                )}`}
                                            >
                                                {getDaysLeftText(
                                                    daysLeft,
                                                    project.status
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {getStatusBadge(project.status)}
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <div
                                                className="text-sm text-gray-600 truncate"
                                                title={project.note}
                                            >
                                                {project.note ||
                                                    t(
                                                        "project_table.not_available"
                                                    )}
                                            </div>
                                        </td>
                                        { (canUpdate || canDelete) && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() =>
                                                            handleEditClick(project)
                                                        }
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title={t(
                                                            "project_table.edit_project"
                                                        )}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                onDelete &&
                                                                typeof onDelete ===
                                                                    "function"
                                                            ) {
                                                                onDelete(project);
                                                            }
                                                        }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title={t(
                                                            "project_table.delete_project"
                                                        )}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}                                        
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            {data.length === 0 && (
                <div className="text-center py-12">
                    <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("project_table.no_projects_found")}
                    </h3>
                    <p className="text-gray-600">
                        {t("project_table.no_projects_message")}
                    </p>
                </div>
            )}

            {/* Summary - Diupdate untuk menggunakan mapping status */}
            {data.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                                {t("project_table.total_projects")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.length}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                                {t("project_table.completed")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {
                                    data.filter((p) =>
                                        [
                                            "completed",
                                            "done",
                                            "finished",
                                        ].includes(p.status?.toLowerCase())
                                    ).length
                                }
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                                {t("project_table.pending")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {
                                    data.filter((p) =>
                                        [
                                            "pending",
                                            "delayed",
                                            "overdue",
                                            "draft",
                                            "new",
                                        ].includes(p.status?.toLowerCase())
                                    ).length
                                }
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                                {t("project_table.cancelled")}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {
                                    data.filter((p) =>
                                        [
                                            "cancelled",
                                            "canceled",
                                            "rejected",
                                        ].includes(p.status?.toLowerCase())
                                    ).length
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <EditProjectModal />
        </div>
    );
};

export default ProjectTable;
