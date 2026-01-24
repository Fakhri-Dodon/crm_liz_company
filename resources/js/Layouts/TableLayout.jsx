import {
    FiEdit2,
    FiTrash2,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiMail,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

/**
 * TableLayout Component
 *
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions [{ key, label, render?, className? }]
 * @param {Array} props.data - Array of data objects
 * @param {Function} props.onEdit - Callback for edit action
 * @param {Function} props.onDelete - Callback for delete action
 * @param {Function} props.onSendEmail - Callback for send email action
 * @param {Boolean} props.showAction - Whether to show action column
 * @param {Object} props.pagination - Pagination configuration
 * @param {Number} props.pagination.currentPage - Current page number
 * @param {Number} props.pagination.totalPages - Total number of pages
 * @param {Number} props.pagination.totalItems - Total number of items
 * @param {Number} props.pagination.itemsPerPage - Items per page
 * @param {Function} props.pagination.onPageChange - Callback when page changes
 */
export default function TableLayout({
    columns = [],
    data = [],
    onEdit,
    onDelete,
    onSendEmail,
    showAction = true,
    pagination = null,
}) {
    const { t } = useTranslation();
    
    // Calculate pagination range
    const getPaginationRange = () => {
        if (!pagination) return [];

        const current = pagination.currentPage || 1;
        const total = pagination.totalPages || 1;
        const delta = 2; // Number of pages to show on each side of current page
        const range = [];

        // Always show first page
        range.push(1);

        // Calculate range around current page
        for (
            let i = Math.max(2, current - delta);
            i <= Math.min(total - 1, current + delta);
            i++
        ) {
            range.push(i);
        }

        // Always show last page if not already included
        if (total > 1 && !range.includes(total)) {
            range.push(total);
        }

        // Add ellipsis if needed
        const result = [];
        range
            .sort((a, b) => a - b)
            .forEach((page, index, array) => {
                if (index > 0 && page - array[index - 1] > 1) {
                    result.push("...");
                }
                result.push(page);
            });

        return result;
    };

    // Calculate showing range text
    const getShowingRange = () => {
        if (!pagination) return null;

        const {
            currentPage = 1,
            itemsPerPage = 10,
            totalItems = 0,
        } = pagination;
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);

        return `Showing ${start} - ${end} of ${totalItems} entries`;
    };

    // Calculate column widths based on content
    const getColumnWidths = () => {
        const widths = {};
        
        columns.forEach((col, index) => {
            if (col.className?.includes('min-w-')) {
                // Extract min-width from className
                const match = col.className.match(/min-w-\[(\d+)px\]/);
                if (match) {
                    widths[col.key] = `${match[1]}px`;
                } else if (col.className.includes('min-w-')) {
                    widths[col.key] = 'auto';
                }
            }
            
            // Set default widths for specific columns
            if (!widths[col.key]) {
                if (col.key === 'quotation_number') widths[col.key] = '150px';
                else if (col.key === 'date') widths[col.key] = '120px';
                else if (col.key === 'subject') widths[col.key] = '230px';
                else if (col.key === 'lead') widths[col.key] = '200px';
                else if (col.key === 'total') widths[col.key] = '180px';
                else if (col.key === 'status') widths[col.key] = '130px';
                else widths[col.key] = 'auto';
            }
        });
        
        return widths;
    };

    const columnWidths = getColumnWidths();

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Table Container - TANPA overflow-x-auto */}
            <div className="w-full">
                <table className="w-full table-fixed">
                    {/* ================= HEADER ================= */}
                    <thead>
                        <tr className="bg-[#c8e1b5] border-b border-blue-200">
                            <th 
                                className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider"
                                style={{ width: '80px' }}
                            >
                                No
                            </th>

                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider ${col.className || ''}`}
                                    style={{ 
                                        width: columnWidths[col.key],
                                        minWidth: columnWidths[col.key].replace('px', '') + 'px'
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}

                            {showAction && (
                                <th 
                                    className="px-6 py-4 text-left text-xs font-semibold text-black uppercase tracking-wider"
                                    style={{ width: '120px' }}
                                >
                                    {t('users.table.actions') || 'Actions'}
                                </th>
                            )}
                        </tr>
                    </thead>

                    {/* ================= BODY ================= */}
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 2}
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="h-12 w-12 text-gray-300 mb-4">
                                            <svg
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.801 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 font-medium">
                                            No data available
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Start by adding some records
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => {
                                const rowNumber = pagination
                                    ? (pagination.currentPage - 1) *
                                          (pagination.itemsPerPage || 10) +
                                      index +
                                      1
                                    : index + 1;

                                return (
                                    <tr
                                        key={row.id ?? index}
                                        className="hover:bg-blue-50 transition-colors duration-150 group"
                                    >
                                        <td 
                                            className="px-6 py-4 align-top"
                                            style={{ width: '80px' }}
                                        >
                                            <span className="text-sm font-medium text-gray-900">
                                                {rowNumber}
                                            </span>
                                        </td>

                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-6 py-4 align-top ${col.className || ''}`}
                                                style={{ 
                                                    width: columnWidths[col.key],
                                                    minWidth: columnWidths[col.key].replace('px', '') + 'px'
                                                }}
                                            >
                                                <div className="text-sm text-gray-900 break-words">
                                                    {col.render
                                                        ? col.render(
                                                              row[col.key],
                                                              row
                                                          )
                                                        : row[col.key] || (
                                                              <span className="text-gray-400 italic">
                                                                  -
                                                              </span>
                                                          )}
                                                </div>
                                            </td>
                                        ))}

                                        {showAction && (
                                            <td 
                                                className="px-6 py-4 align-top"
                                                style={{ width: '120px' }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {/* Tombol Email */}
                                                    {onSendEmail && (
                                                        <button
                                                            onClick={() =>
                                                                onSendEmail(
                                                                    row
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                                            title="Send Email"
                                                        >
                                                            <FiMail size={18} />
                                                        </button>
                                                    )}

                                                    {onEdit && (
                                                        <button
                                                            onClick={() =>
                                                                onEdit(row)
                                                            }
                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group-hover:border-blue-300"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {onDelete && (
                                                        <button
                                                            onClick={() =>
                                                                onDelete(row)
                                                            }
                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 group-hover:border-red-300"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ================= PAGINATION ================= */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Showing Range */}
                        <div className="text-sm text-gray-600">
                            {getShowingRange()}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-1">
                            {/* First Page */}
                            <button
                                onClick={() =>
                                    pagination.onPageChange &&
                                    pagination.onPageChange(1)
                                }
                                disabled={pagination.currentPage === 1}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="First page"
                            >
                                <FiChevronsLeft className="w-4 h-4" />
                            </button>

                            {/* Previous Page */}
                            <button
                                onClick={() =>
                                    pagination.onPageChange &&
                                    pagination.onPageChange(
                                        pagination.currentPage - 1
                                    )
                                }
                                disabled={pagination.currentPage === 1}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Previous page"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Page Numbers */}
                            {getPaginationRange().map((page, index) =>
                                page === "..." ? (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="px-3 py-1 text-gray-400"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() =>
                                            pagination.onPageChange &&
                                            pagination.onPageChange(page)
                                        }
                                        className={`px-3 py-1 min-w-[2.5rem] text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            page === pagination.currentPage
                                                ? "bg-blue-600 text-white border border-blue-600"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-white border border-gray-300"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            {/* Next Page */}
                            <button
                                onClick={() =>
                                    pagination.onPageChange &&
                                    pagination.onPageChange(
                                        pagination.currentPage + 1
                                    )
                                }
                                disabled={
                                    pagination.currentPage ===
                                    pagination.totalPages
                                }
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Next page"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>

                            {/* Last Page */}
                            <button
                                onClick={() =>
                                    pagination.onPageChange &&
                                    pagination.onPageChange(
                                        pagination.totalPages
                                    )
                                }
                                disabled={
                                    pagination.currentPage ===
                                    pagination.totalPages
                                }
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:bg-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Last page"
                            >
                                <FiChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= FOOTER ================= */}
            {data.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            {t('users.table.total_rows') || 'Total rows:'}{" "}
                            <span className="font-medium">{data.length}</span>
                        </div>
                        {pagination && (
                            <div className="text-xs text-gray-500">
                                Page{" "}
                                <span className="font-medium">
                                    {pagination.currentPage}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium">
                                    {pagination.totalPages}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}