'use client'

import { forwardRef } from 'react'
import { Watch, Phone, Mail, MapPin } from 'lucide-react'

interface InvoiceItem {
  name: string
  quantity: number
  unit_price: number
  total: number
}

interface InvoiceData {
  invoice_number: string
  date: string
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax?: number
  total: number
  payment_mode: string
  notes?: string
}

interface BusinessInfo {
  name: string
  address: string
  phone: string
  email: string
  gst?: string
}

interface InvoiceTemplateProps {
  invoice: InvoiceData
  business: BusinessInfo
  type?: 'sale' | 'repair'
  format?: 'a4' | 'thermal'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// A4 Format Invoice
export const A4Invoice = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, business, type = 'sale' }, ref) => {
    return (
      <div ref={ref} className="bg-white p-8 min-h-[297mm] w-[210mm] mx-auto print:shadow-none shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center">
              <Watch className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-sm text-gray-600">{business.address}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{business.phone}</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{business.email}</span>
              </div>
              {business.gst && <p className="text-xs text-gray-500 mt-1">GSTIN: {business.gst}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900">
              {type === 'sale' ? 'INVOICE' : 'REPAIR RECEIPT'}
            </h2>
            <p className="text-lg font-medium text-gray-700 mt-2">{invoice.invoice_number}</p>
            <p className="text-sm text-gray-500">Date: {formatDate(invoice.date)}</p>
          </div>
        </div>

        {/* Customer Info */}
        {invoice.customer_name && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">BILL TO</h3>
            <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
            {invoice.customer_phone && <p className="text-sm text-gray-600">{invoice.customer_phone}</p>}
            {invoice.customer_address && <p className="text-sm text-gray-600">{invoice.customer_address}</p>}
          </div>
        )}

        {/* Items Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="py-3 px-4 text-left font-medium">Item</th>
              <th className="py-3 px-4 text-center font-medium">Qty</th>
              <th className="py-3 px-4 text-right font-medium">Rate</th>
              <th className="py-3 px-4 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4">{item.name}</td>
                <td className="py-3 px-4 text-center">{item.quantity}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax && invoice.tax > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-gray-900 text-white px-3 -mx-3 mt-2">
              <span className="font-bold text-lg">TOTAL</span>
              <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-medium uppercase">{invoice.payment_mode}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-yellow-800">Notes:</p>
            <p className="text-sm text-yellow-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-6 mt-auto">
          <div className="text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">For any queries, please contact us at {business.phone}</p>
          </div>
        </div>
      </div>
    )
  }
)

A4Invoice.displayName = 'A4Invoice'

// Thermal (80mm/58mm) Receipt Format
export const ThermalReceipt = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, business, type = 'sale' }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white p-4 w-[80mm] mx-auto font-mono text-sm print:shadow-none shadow-lg"
        style={{ fontFamily: 'monospace' }}
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="text-lg font-bold">{business.name}</h1>
          <p className="text-xs">{business.address}</p>
          <p className="text-xs">{business.phone}</p>
          {business.gst && <p className="text-xs">GSTIN: {business.gst}</p>}
        </div>

        {/* Invoice Info */}
        <div className="text-center mb-3">
          <p className="font-bold">{type === 'sale' ? 'SALE RECEIPT' : 'REPAIR RECEIPT'}</p>
          <p className="text-xs">{invoice.invoice_number}</p>
          <p className="text-xs">{formatDate(invoice.date)}</p>
        </div>

        {/* Customer */}
        {invoice.customer_name && (
          <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
            <p className="text-xs">Customer: {invoice.customer_name}</p>
            {invoice.customer_phone && <p className="text-xs">Phone: {invoice.customer_phone}</p>}
          </div>
        )}

        {/* Items */}
        <div className="border-t border-dashed border-gray-400 py-2">
          <div className="flex justify-between font-bold text-xs mb-1">
            <span>ITEM</span>
            <span>AMT</span>
          </div>
          {invoice.items.map((item, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between text-xs">
                <span className="truncate flex-1 pr-2">{item.name}</span>
                <span className="font-medium">{formatCurrency(item.total)}</span>
              </div>
              <div className="text-xs text-gray-500 pl-2">
                {item.quantity} x {formatCurrency(item.unit_price)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-400 py-2">
          <div className="flex justify-between text-xs">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-xs">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold mt-1 pt-1 border-t border-gray-300">
            <span>TOTAL</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="border-t border-dashed border-gray-400 py-2 text-xs">
          <p>Payment: {invoice.payment_mode.toUpperCase()}</p>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-gray-400 pt-3 text-center text-xs">
          <p>Thank you for your visit!</p>
          <p className="mt-2">***** END *****</p>
        </div>
      </div>
    )
  }
)

ThermalReceipt.displayName = 'ThermalReceipt'

// Print utility function
export function printInvoice(elementRef: React.RefObject<HTMLDivElement>, title: string) {
  if (!elementRef.current) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups for printing')
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${elementRef.current.outerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}
