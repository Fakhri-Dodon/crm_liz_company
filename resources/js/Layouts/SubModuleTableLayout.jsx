// resources/js/Layouts/SubModuleTableLayout.jsx
import React, { useState, useEffect } from "react";
import { 
    Maximize2, Minimize2, ChevronDown, ChevronUp, 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Edit2, Trash2, MoreHorizontal
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SubModuleTableLayout({
    columns = [],
    data = [],
    onEdit,
    onDelete,
    showAction = true,
    pagination = null,
    tableTitle = "",
    showHeader = true,
    showFooter = true,
    onRowClick,
    expandableConfig = null,
    compactMode = false,
    rowHeight = 'h-14',
}) {
    const { t } = useTranslation();
    const [expandedRows, setExpandedRows] = useState({});
    const [expandedContents, setExpandedContents] = useState({});
    const [currentPage, setCurrentPage] = useState(pagination?.currentPage || 1);
    const [showMobileActions, setShowMobileActions] = useState({});
    
    const itemsPerPage = pagination?.itemsPerPage || 10;

    // Calculate pagination if not provided
    const totalItems = pagination?.totalItems || data.length;
    const totalPages = pagination?.totalPages || Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = pagination ? data : data.slice(startIndex, endIndex);

    // Calculate dynamic column widths
    const calculateColumnWidths = () => {
        const columnCount = columns.length;
        const actionWidth = showAction && (onEdit || onDelete) ? (compactMode ? 70 : 80) : 0;
        const expandWidth = expandableConfig ? 40 : 0;
        
        // Total available width
        const availableWidth = 1000 - actionWidth - expandWidth;
        
        // Calculate width per column
        let widthPerColumn = Math.floor(availableWidth / columnCount);
        
        // Ensure minimum width
        widthPerColumn = Math.max(widthPerColumn, compactMode ? 100 : 120);
        
        return widthPerColumn;
    };

    const columnWidth = calculateColumnWidths();

    // Toggle row expansion
    const toggleRowExpand = (rowId) => {
        setExpandedRows(prev => ({
            ...prev,
            [rowId]: !prev[rowId]
        }));
    };

    // Toggle content expansion
    const toggleContentExpand = (rowId, field) => {
        setExpandedContents(prev => ({
            ...prev,
            [`${rowId}_${field}`]: !prev[`${rowId}_${field}`]
        }));
    };

    // Toggle mobile actions
    const toggleMobileActions = (rowId, e) => {
        e?.stopPropagation();
        setShowMobileActions(prev => ({
            ...prev,
            [rowId]: !prev[rowId]
        }));
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        if (pagination?.onPageChange) {
            pagination.onPageChange(page);
        }
    };

    // Calculate pagination range
    const getPaginationRange = () => {
        const current = currentPage;
        const total = totalPages;
        const delta = 2;
        const range = [];

        range.push(1);

        for (
            let i = Math.max(2, current - delta);
            i <= Math.min(total - 1, current + delta);
            i++
        ) {
            range.push(i);
        }

        if (total > 1 && !range.includes(total)) {
            range.push(total);
        }

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

    // Komponen untuk expandable text
    const ExpandableText = ({ text, rowId, field, maxLength = 30, className = "" }) => {
        const isExpanded = expandedContents[`${rowId}_${field}`];
        
        if (!text || text.length <= maxLength) {
            return <span className={`${className} truncate`}>{text || "-"}</span>;
        }
        
        return (
            <div className={`flex items-start gap-1 ${className}`}>
                <div className={`flex-1 min-w-0 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {text}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleContentExpand(rowId, field);
                    }}
                    className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title={isExpanded ? t("table.collapse") : t("table.expand")}
                >
                    {isExpanded ? (
                        <Minimize2 className="w-3 h-3" />
                    ) : (
                        <Maximize2 className="w-3 h-3" />
                    )}
                </button>
            </div>
        );
    };

    // Komponen untuk expandable amount
    const ExpandableAmount = ({ amount, rowId, field, formatFunction }) => {
        const isExpanded = expandedContents[`${rowId}_${field}`];
        const formattedAmount = formatFunction ? formatFunction(amount) : amount;
        
        if (!formattedAmount || formattedAmount.length <= 12) {
            return <span className="font-medium truncate">{formattedAmount}</span>;
        }
        
        return (
            <div className="flex items-center gap-1">
                <div className={`font-medium ${!isExpanded ? 'truncate' : ''}`}>
                    {formattedAmount}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleContentExpand(rowId, field);
                    }}
                    className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title={isExpanded ? t("table.collapse") : t("table.expand")}
                >
                    {isExpanded ? (
                        <Minimize2 className="w-3 h-3" />
                    ) : (
                        <Maximize2 className="w-3 h-3" />
                    )}
                </button>
            </div>
        );
    };

    // Render default cell content
    const renderCellContent = (value, row, column) => {
        if (column.render) {
            return column.render(value, row);
        }
        
        if (typeof value === 'string' && value.length > 30) {
            return (
                <ExpandableText 
                    text={value} 
                    rowId={row.id} 
                    field={column.key}
                    maxLength={compactMode ? 15 : 20}
                />
            );
        }
        
        return <span className="truncate">{value || "-"}</span>;
    };

    // Render Actions Cell
    const ActionsCell = ({ row }) => (
        <div className="flex items-center gap-1">
            {onEdit && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(row);
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-200"
                    title={t("table.edit")}
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            )}

            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(row);
                    }}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                    title={t("table.delete")}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );

    // Mobile Card View - TANPA NOMOR
    const MobileCardView = ({ row, index }) => {
        const isRowExpanded = expandedRows[row.id];
        const showActions = showMobileActions[row.id];
        
        return (
            <div 
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow mb-2"
                onClick={() => onRowClick && onRowClick(row)}
            >
                <div className="space-y-2">
                    {/* Header tanpa nomor */}
                    <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                            {columns[0] && (
                                <div className="font-semibold text-gray-900 min-w-0 truncate text-xs">
                                    {renderCellContent(row[columns[0].key], row, columns[0])}
                                </div>
                            )}
                        </div>
                        
                        {showAction && (onEdit || onDelete) && (
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                                <button
                                    onClick={(e) => toggleMobileActions(row.id, e)}
                                    className="p-1 text-gray-500 hover:text-gray-700"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                
                                {showActions && (
                                    <div className="flex flex-col items-end gap-1 bg-white border border-gray-200 rounded-md p-1 shadow-sm">
                                        {onEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(row);
                                                    setShowMobileActions({});
                                                }}
                                                className="flex items-center gap-1 p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors duration-200 text-xs"
                                                title={t("table.edit")}
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                <span>Edit</span>
                                            </button>
                                        )}
                                        
                                        {onDelete && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(row);
                                                    setShowMobileActions({});
                                                }}
                                                className="flex items-center gap-1 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200 text-xs"
                                                title={t("table.delete")}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                <span>Hapus</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Konten utama - semua kolom kecuali pertama */}
                    {columns.slice(1).map((column, idx) => (
                        <div key={column.key} className="min-w-0">
                            <div className="text-gray-500 mb-0.5 text-[10px]">
                                {column.label}
                            </div>
                            <div className="text-gray-900 text-xs">
                                {renderCellContent(row[column.key], row, column)}
                            </div>
                        </div>
                    ))}
                    
                    {/* Expandable content */}
                    {expandableConfig && (
                        <>
                            {isRowExpanded && expandableConfig.render && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    {expandableConfig.render(row)}
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRowExpand(row.id);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                                >
                                    {isRowExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    <span>{isRowExpanded ? t("table.show_less") : t("table.show_more")}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header Section */}
            {showHeader && (
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2`}>
                    {tableTitle && (
                        <div>
                            <h2 className={`font-bold text-gray-900 ${compactMode ? 'text-base' : 'text-lg'}`}>
                                {tableTitle}
                            </h2>
                            <p className={`text-gray-600 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                                {t("table.showing_count", { 
                                    count: totalItems,
                                    start: startIndex + 1,
                                    end: endIndex 
                                })}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop Table View - TANPA KOLOM NO */}
            <div className="hidden lg:block overflow-hidden">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    {/* Table Container */}
                    <div className="w-full overflow-x-auto">
                        <table className={`w-full ${compactMode ? 'text-xs' : 'text-sm'}`}>
                            {/* HEADER - TANPA NO */}
                            <thead>
                                <tr className="bg-[#c8e1b5] border-b border-blue-200">
                                    {columns.map((column) => {
                                        // Use column.width if provided, otherwise use calculated width
                                        const width = column.width || `${columnWidth}px`;
                                        
                                        return (
                                            <th
                                                key={column.key}
                                                className={`text-left font-semibold text-black uppercase tracking-wider px-3 py-2 whitespace-nowrap ${column.className || ''}`}
                                                style={{ 
                                                    width,
                                                    minWidth: column.minWidth || '100px'
                                                }}
                                            >
                                                <div className="truncate">
                                                    {column.label}
                                                </div>
                                            </th>
                                        );
                                    })}
                                    {showAction && (onEdit || onDelete) && (
                                        <th 
                                            className="text-left font-semibold text-black uppercase tracking-wider px-3 py-2 whitespace-nowrap"
                                            style={{ width: compactMode ? '70px' : '80px' }}
                                        >
                                            <div className="truncate">
                                                {t("table.actions")}
                                            </div>
                                        </th>
                                    )}
                                    {expandableConfig && (
                                        <th 
                                            className="text-left font-semibold text-black uppercase tracking-wider px-2 py-2 whitespace-nowrap"
                                            style={{ width: '40px' }}
                                        >
                                            {/* Empty */}
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            {/* BODY - TANPA NO */}
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.map((row, index) => {
                                    const isRowExpanded = expandedRows[row.id];

                                    return (
                                        <React.Fragment key={row.id || index}>
                                            <tr 
                                                className={`hover:bg-gray-50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''} ${compactMode ? 'h-11' : 'h-14'}`}
                                                onClick={() => onRowClick && onRowClick(row)}
                                            >
                                                {/* Data Columns tanpa No */}
                                                {columns.map((column) => {
                                                    const width = column.width || `${columnWidth}px`;
                                                    
                                                    return (
                                                        <td
                                                            key={column.key}
                                                            className={`align-middle px-3 py-2 ${column.className || ''}`}
                                                            style={{ 
                                                                width,
                                                                minWidth: column.minWidth || '100px'
                                                            }}
                                                        >
                                                            <div className="min-w-0">
                                                                {renderCellContent(row[column.key], row, column)}
                                                            </div>
                                                        </td>
                                                    );
                                                })}

                                                {/* Actions Column */}
                                                {showAction && (onEdit || onDelete) && (
                                                    <td 
                                                        className="align-middle px-3 py-2"
                                                        style={{ width: compactMode ? '70px' : '80px' }}
                                                    >
                                                        <ActionsCell row={row} />
                                                    </td>
                                                )}

                                                {/* Expand Column */}
                                                {expandableConfig && (
                                                    <td 
                                                        className="align-middle px-2 py-2"
                                                        style={{ width: '40px' }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleRowExpand(row.id);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                            title={isRowExpanded ? t("table.collapse") : t("table.expand")}
                                                        >
                                                            {isRowExpanded ? (
                                                                <ChevronUp className="w-3 h-3" />
                                                            ) : (
                                                                <ChevronDown className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                            
                                            {/* Expanded Row Detail */}
                                            {isRowExpanded && expandableConfig?.render && (
                                                <tr className="bg-blue-50 border-t border-blue-100">
                                                    <td colSpan={columns.length + (showAction ? 1 : 0) + (expandableConfig ? 1 : 0)} 
                                                         className="px-3 py-2">
                                                        {expandableConfig.render(row)}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className={`border-t border-gray-200 bg-gray-50 px-3 py-2`}>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                {/* Showing Range */}
                                <div className="text-gray-600 text-xs">
                                    {t("table.showing_range", { 
                                        start: startIndex + 1, 
                                        end: endIndex, 
                                        total: totalItems 
                                    })}
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center gap-1">
                                    {/* First Page */}
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        title={t("table.first_page")}
                                    >
                                        <ChevronsLeft className="w-3 h-3" />
                                    </button>

                                    {/* Previous Page */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        title={t("table.previous_page")}
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                    </button>

                                    {/* Page Numbers */}
                                    {getPaginationRange().map((page, index) =>
                                        page === "..." ? (
                                            <span
                                                key={`ellipsis-${index}`}
                                                className="px-2 text-gray-400"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors duration-200 min-w-[2rem] ${
                                                    page === currentPage
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
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        title={t("table.next_page")}
                                    >
                                        <ChevronRight className="w-3 h-3" />
                                    </button>

                                    {/* Last Page */}
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        title={t("table.last_page")}
                                    >
                                        <ChevronsRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOOTER */}
                    {showFooter && data.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50 px-3 py-1.5">
                            <div className="flex items-center justify-between">
                                <div className="text-gray-500 text-[10px]">
                                    {t("table.total_rows")}: <span className="font-medium">{totalItems}</span>
                                </div>
                                {totalPages > 0 && (
                                    <div className="text-gray-500 text-[10px]">
                                        {t("table.page")} <span className="font-medium">{currentPage}</span> {t("table.of")}{" "}
                                        <span className="font-medium">{totalPages}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View - TANPA NOMOR */}
            <div className="lg:hidden">
                <div className="space-y-2">
                    {paginatedData.map((row, index) => (
                        <MobileCardView key={row.id || index} row={row} index={index} />
                    ))}
                    
                    {/* Mobile Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex flex-col items-center gap-3">
                                <div className="text-gray-600 text-xs">
                                    {t("table.showing_range_mobile", { 
                                        start: startIndex + 1, 
                                        end: endIndex, 
                                        total: totalItems 
                                    })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                    >
                                        <ChevronsLeft className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                    </button>
                                    <span className="px-3 font-medium text-xs">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                    >
                                        <ChevronsRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper components
export const ExpandableTextCell = ({ text, maxLength = 30, className = "" }) => {
    const [expanded, setExpanded] = useState(false);
    
    if (!text || text.length <= maxLength) {
        return <span className={`text-gray-900 truncate ${className} text-xs`}>{text || "-"}</span>;
    }
    
    return (
        <div className={`flex items-start gap-1 text-xs`}>
            <div className={`flex-1 min-w-0 ${!expanded ? 'line-clamp-2' : ''}`}>
                {text}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                }}
                className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                title={expanded ? "Collapse" : "Expand"}
            >
                {expanded ? (
                    <Minimize2 className="w-3 h-3" />
                ) : (
                    <Maximize2 className="w-3 h-3" />
                )}
            </button>
        </div>
    );
};

export const ExpandableAmountCell = ({ amount, formatFunction, className = "" }) => {
    const [expanded, setExpanded] = useState(false);
    const formattedAmount = formatFunction ? formatFunction(amount) : amount;
    
    if (!formattedAmount || formattedAmount.length <= 12) {
        return <span className={`font-medium truncate ${className} text-xs`}>{formattedAmount}</span>;
    }
    
    return (
        <div className="flex items-center gap-1 text-xs">
            <div className={`font-medium ${!expanded ? 'truncate' : ''}`}>
                {formattedAmount}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                }}
                className="p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                title={expanded ? "Collapse" : "Expand"}
            >
                {expanded ? (
                    <Minimize2 className="w-3 h-3" />
                ) : (
                    <Maximize2 className="w-3 h-3" />
                )}
            </button>
        </div>
    );
};