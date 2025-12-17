import { FiEdit2, FiTrash2 } from "react-icons/fi";

/**
 * props:
 * - columns: [{ key, label, render? }]
 * - data: array of object
 * - onEdit?: (row) => void
 * - onDelete?: (row) => void
 * - showAction?: boolean
 * - pagination?: number[]
 */
export default function TableLayout({
  columns = [],
  data = [],
  onEdit,
  onDelete,
  showAction = true,
  pagination = [],
}) {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          {/* ================= HEADER ================= */}
          <thead>
            <tr className="bg-green-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                No
              </th>

              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                >
                  {col.label}
                </th>
              ))}

              {showAction && (
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Action
                </th>
              )}
            </tr>
          </thead>

          {/* ================= BODY ================= */}
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Data tidak tersedia
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id ?? index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {index + 1}
                  </td>

                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-4 text-sm text-gray-700"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}

                  {showAction && (
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ================= PAGINATION ================= */}
        {pagination.length > 0 && (
          <div className="flex justify-end items-center gap-2 px-4 py-4 border-t border-gray-200">
            {pagination.map((p) => (
              <button
                key={p}
                className="w-8 h-8 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
