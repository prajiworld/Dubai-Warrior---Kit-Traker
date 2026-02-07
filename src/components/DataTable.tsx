import React, { useState } from 'react';

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: {
    header: string;
    accessor: keyof T & string;
    editable?: boolean;
    type?: 'text' | 'number' | 'boolean' | 'dropdown';
    options?: string[];
    render?: (row: T) => React.ReactNode;
  }[];
  onUpdate?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  idAccessor: keyof T & string;
}

const DataTable = <T extends { [key: string]: any }>({
  title,
  data,
  columns,
  onUpdate,
  onEdit,
  onDelete,
  idAccessor,
}: DataTableProps<T>) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<T | null>(null);

  const safeData = Array.isArray(data) ? data : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  const handleEdit = (item: T) => {
    setEditingId(String(item[idAccessor]));
    setEditedData(item);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedData(null);
  };

  const handleSave = () => {
    if (editedData && onUpdate) {
      onUpdate(editedData);
    }
    setEditingId(null);
    setEditedData(null);
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleChange = (accessor: keyof T, value: any) => {
    if (editedData) {
      const newEditedData = { ...editedData, [accessor]: value };
      setEditedData(newEditedData);
    }
  };

  // Always show the Actions column if any action handlers are provided
  const showActions = Boolean(onUpdate || onEdit || onDelete);

  return (
    <div>
      {title && (
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>
      )}
      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {safeColumns.map((column) => (
                <th
                  key={column.accessor as string}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                >
                  {column.header}
                </th>
              ))}
              {showActions && (
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {safeData.map((item) => {
              const rowId = String(item[idAccessor]);
              // Inline editing only when onEdit is NOT provided (onEdit = external handler)
              const isEditing = !onEdit && rowId === editingId;

              return (
                <tr key={rowId}>
                  {safeColumns.map((column) => {
                    const rawValue =
                      isEditing && editedData
                        ? editedData[column.accessor]
                        : item[column.accessor];

                    const currentValue =
                      rawValue === undefined || rawValue === null
                        ? ''
                        : rawValue;

                    return (
                      <td
                        key={column.accessor as string}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        {/* 1. If custom renderer is provided, always use it */}
                        {column.render ? (
                          column.render(item)
                        ) : isEditing && column.editable ? (
                          // 2. Inline editing controls
                          column.type === 'dropdown' ? (
                            <select
                              value={currentValue}
                              onChange={(e) =>
                                handleChange(column.accessor, e.target.value)
                              }
                              className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                            >
                              {column.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : column.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={!!currentValue}
                              onChange={(e) =>
                                handleChange(
                                  column.accessor,
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          ) : (
                            <input
                              type={column.type || 'text'}
                              value={String(currentValue)}
                              onChange={(e) =>
                                handleChange(
                                  column.accessor,
                                  column.type === 'number'
                                    ? parseFloat(e.target.value) || 0
                                    : e.target.value
                                )
                              }
                              className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                          )
                        ) : (
                          // 3. Default display
                          <div className="text-gray-900 dark:text-white">
                            {typeof item[column.accessor] === 'boolean'
                              ? item[column.accessor]
                                ? 'Yes'
                                : 'No'
                              : currentValue !== ''
                              ? String(currentValue)
                              : ''}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <>
                          {onUpdate && (
                            <button
                              onClick={handleSave}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              Save
                            </button>
                          )}
                          <button
                            onClick={handleCancel}
                            className="ml-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              Edit
                            </button>
                          )}
                          {onUpdate && !onEdit && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="ml-4 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => handleDelete(rowId)}
                              className="ml-4 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
