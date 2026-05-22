import type { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  data?: T[]
  columns: Column<T>[]
  isLoading?: boolean
  error?: string
  emptyMessage?: string
  onRowClick?: (row: T) => void
  actions?: (row: T) => ReactNode
}

export function DataTable<T>({
  data = [],
  columns,
  isLoading,
  error,
  emptyMessage = 'Không có dữ liệu để hiển thị.',
  onRowClick,
  actions,
}: DataTableProps<T>) {
  return (
    <div className="data-surface">
      {error ? <div className="error-banner">{error}</div> : null}

      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                {column.header}
              </th>
            ))}
            {actions && <th style={{ width: 100, textAlign: 'center' }}>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                <td colSpan={columns.length} className="skeleton-row" />
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="empty-state">{emptyMessage}</div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                {columns.map((column) => (
                  <td key={column.key} style={{ textAlign: column.align ?? 'left' }}>
                    {column.render ? column.render(row) : (row as Record<string, unknown>)[column.key]}
                  </td>
                ))}
                {actions && (
                  <td
                    onClick={(e) => e.stopPropagation()}
                    style={{ textAlign: 'center', padding: '8px' }}
                  >
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


