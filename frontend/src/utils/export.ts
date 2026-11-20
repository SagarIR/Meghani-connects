import * as XLSX from 'xlsx'

interface ExportColumn {
  key: string
  header: string
  transform?: (value: any, row: any) => string | number
}

/**
 * Export data to CSV file
 */
export function exportToCSV(
  data: any[],
  columns: ExportColumn[],
  filename: string
) {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Create header row
  const headers = columns.map(col => col.header)
  
  // Create data rows
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key]
      if (col.transform) {
        return col.transform(value, row)
      }
      // Handle special cases
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return value
    })
  )

  // Combine headers and data
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape cells containing commas or quotes
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    )
  ].join('\n')

  // Download
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Export data to Excel file
 */
export function exportToExcel(
  data: any[],
  columns: ExportColumn[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Transform data
  const transformedData = data.map(row => {
    const newRow: Record<string, any> = {}
    columns.forEach(col => {
      const value = row[col.key]
      newRow[col.header] = col.transform ? col.transform(value, row) : value
    })
    return newRow
  })

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(transformedData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Auto-size columns
  const colWidths = columns.map(col => ({
    wch: Math.max(
      col.header.length,
      ...transformedData.map(row => String(row[col.header] || '').length)
    ) + 2
  }))
  worksheet['!cols'] = colWidths

  // Generate Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Export multiple sheets to Excel
 */
export function exportToExcelMultiSheet(
  sheets: { name: string; data: any[]; columns: ExportColumn[] }[],
  filename: string
) {
  const workbook = XLSX.utils.book_new()

  sheets.forEach(sheet => {
    if (sheet.data.length === 0) return

    const transformedData = sheet.data.map(row => {
      const newRow: Record<string, any> = {}
      sheet.columns.forEach(col => {
        const value = row[col.key]
        newRow[col.header] = col.transform ? col.transform(value, row) : value
      })
      return newRow
    })

    const worksheet = XLSX.utils.json_to_sheet(transformedData)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Download file helper
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: mimeType })
    : content

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number): string {
  return `₹${amount?.toLocaleString('en-IN') || 0}`
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Common export column definitions
 */
export const productExportColumns: ExportColumn[] = [
  { key: 'article_code', header: 'Article Code' },
  { key: 'name', header: 'Product Name' },
  { key: 'brand', header: 'Brand' },
  { key: 'category', header: 'Category' },
  { key: 'subcategory', header: 'Subcategory' },
  { key: 'model_number', header: 'Model Number' },
  { key: 'size', header: 'Size' },
  { key: 'barcode', header: 'Barcode' },
  { key: 'mrp', header: 'MRP', transform: (v) => formatCurrencyForExport(v) },
  { key: 'cost_price', header: 'Cost Price', transform: (v) => formatCurrencyForExport(v) },
  { key: 'selling_price', header: 'Selling Price', transform: (v) => formatCurrencyForExport(v) },
  { key: 'profit_margin', header: 'Profit Margin', transform: (v) => formatCurrencyForExport(v) },
  { key: 'unit', header: 'Unit' },
  { key: 'hsn_code', header: 'HSN Code' },
  { key: 'tax_rate', header: 'GST Rate (%)', transform: (v) => v != null ? `${v}%` : 'Default' },
  { key: 'stock', header: 'Stock' },
  { key: 'warranty_months', header: 'Warranty (Months)' },
  { key: 'supplier_name', header: 'Supplier' },
]

export const customerExportColumns: ExportColumn[] = [
  { key: 'name', header: 'Name' },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email' },
  { key: 'address', header: 'Address' },
  { key: 'loyalty_points', header: 'Loyalty Points' },
  { key: 'total_purchases', header: 'Total Purchases', transform: (v) => formatCurrencyForExport(v) },
  { key: 'created_at', header: 'Customer Since', transform: (v) => formatDateForExport(v) },
]

export const saleExportColumns: ExportColumn[] = [
  { key: 'invoice_number', header: 'Invoice #' },
  { key: 'sale_date', header: 'Date', transform: (v) => formatDateForExport(v) },
  { key: 'customer_name', header: 'Customer' },
  { key: 'total_amount', header: 'Total', transform: (v) => formatCurrencyForExport(v) },
  { key: 'discount', header: 'Discount', transform: (v) => formatCurrencyForExport(v) },
  { key: 'profit', header: 'Profit', transform: (v) => formatCurrencyForExport(v) },
  { key: 'payment_mode', header: 'Payment Mode' },
]

export const repairExportColumns: ExportColumn[] = [
  { key: 'ticket_number', header: 'Ticket #' },
  { key: 'customer_name', header: 'Customer' },
  { key: 'customer_phone', header: 'Phone' },
  { key: 'item_type', header: 'Item Type' },
  { key: 'brand', header: 'Brand' },
  { key: 'issue', header: 'Issue' },
  { key: 'status', header: 'Status' },
  { key: 'repair_charge', header: 'Charge', transform: (v) => formatCurrencyForExport(v) },
  { key: 'received_date', header: 'Received', transform: (v) => formatDateForExport(v) },
  { key: 'expected_delivery', header: 'Expected Delivery', transform: (v) => formatDateForExport(v) },
]

export const expenseExportColumns: ExportColumn[] = [
  { key: 'date', header: 'Date', transform: (v) => formatDateForExport(v) },
  { key: 'category', header: 'Category' },
  { key: 'description', header: 'Description' },
  { key: 'amount', header: 'Amount', transform: (v) => formatCurrencyForExport(v) },
  { key: 'payment_method', header: 'Payment Method' },
]
