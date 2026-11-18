'use client'

import { useRef } from 'react'
import { Printer, Download, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import clsx from 'clsx'

interface InvoiceItem {
  name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface InvoiceData {
  invoice_number: string
  date: string
  customer_name?: string
  customer_phone?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_mode: string
  payment_details?: Record<string, number>
  cashier?: string
}

interface InvoiceProps {
  data: InvoiceData
  onClose: () => void
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessGST?: string
}

export default function Invoice({
  data,
  onClose,
  businessName = 'Meghani Watch Co.',
  businessAddress = 'Cactus Park, 23, New Sama Rd, Near Abhilasha Char Rasta, Vadodara, Gujarat - 390008',
  businessPhone = '+91 91066 80191',
  businessGST = 'GSTIN: 24AAAAA0000A1Z5',
}: InvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${data.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 20px;
              max-width: 80mm;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #333; padding-bottom: 15px; }
            .business-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .business-info { font-size: 11px; color: #555; line-height: 1.4; }
            .invoice-meta { margin: 15px 0; font-size: 12px; }
            .invoice-meta div { display: flex; justify-content: space-between; margin: 3px 0; }
            .customer-info { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 12px; }
            .items-header { display: flex; font-weight: bold; font-size: 11px; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .item { display: flex; font-size: 11px; padding: 6px 0; border-bottom: 1px dashed #eee; }
            .item-name { flex: 2; }
            .item-qty { flex: 0.5; text-align: center; }
            .item-price { flex: 1; text-align: right; }
            .item-total { flex: 1; text-align: right; font-weight: 500; }
            .summary { margin-top: 15px; border-top: 2px dashed #333; padding-top: 15px; }
            .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
            .total-row { font-size: 16px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; border-top: 2px dashed #333; padding-top: 15px; }
            .payment-badge { display: inline-block; background: #333; color: white; padding: 3px 10px; border-radius: 3px; font-size: 10px; text-transform: uppercase; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#171613] border border-[#2A261F] text-[#F3EFE6] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A261F] bg-[#12110F]/80">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-lg text-[#F3EFE6]">Receipt Preview</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9A45C]/15 text-[#C9A45C] font-semibold">
              {data.invoice_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="luxury" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
              Print Receipt
            </Button>
            <button onClick={onClose} className="p-2 text-[#8D8980] hover:text-[#F3EFE6] hover:bg-[#1F1E1A] rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)] bg-[#0B0B0A]/40 flex justify-center">
          <div ref={printRef} className="bg-white text-gray-900 rounded-xl p-5 shadow-lg max-w-[80mm] w-full font-mono text-xs">
            {/* Business Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-gray-300">
              <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
              <p className="text-xs text-gray-500 mt-1">{businessAddress}</p>
              <p className="text-xs text-gray-500">Tel: {businessPhone}</p>
              <p className="text-xs text-gray-500">{businessGST}</p>
            </div>

            {/* Invoice Meta */}
            <div className="py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice:</span>
                <span className="font-semibold">{data.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{formatDate(data.date)}</span>
              </div>
              {data.cashier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cashier:</span>
                  <span>{data.cashier}</span>
                </div>
              )}
            </div>

            {/* Customer Info */}
            {data.customer_name && (
              <div className="bg-gray-50 rounded-lg p-3 my-3">
                <p className="text-sm font-medium text-gray-900">{data.customer_name}</p>
                {data.customer_phone && (
                  <p className="text-xs text-gray-500">{data.customer_phone}</p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="my-4">
              <div className="flex text-xs font-semibold text-gray-500 pb-2 border-b border-gray-200">
                <span className="flex-[2]">Item</span>
                <span className="flex-[0.5] text-center">Qty</span>
                <span className="flex-1 text-right">Price</span>
                <span className="flex-1 text-right">Total</span>
              </div>
              {data.items.map((item, index) => (
                <div key={index} className="flex text-sm py-2 border-b border-dashed border-gray-100">
                  <span className="flex-[2] text-gray-900 truncate pr-2">{item.name}</span>
                  <span className="flex-[0.5] text-center text-gray-600">{item.quantity}</span>
                  <span className="flex-1 text-right text-gray-600">{formatCurrency(item.unit_price)}</span>
                  <span className="flex-1 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(data.discount)}</span>
                </div>
              )}
              {data.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(data.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 pt-2">
                <span className="bg-gray-900 text-white text-xs px-3 py-1 rounded uppercase font-semibold tracking-wider">
                  {data.payment_mode === 'mixed' ? 'SPLIT / MIXED PAYMENT' : data.payment_mode}
                </span>
                {data.payment_mode === 'mixed' && data.payment_details && (
                  <div className="text-[11px] text-gray-700 flex flex-wrap justify-center gap-1.5 mt-1">
                    {Object.entries(data.payment_details)
                      .filter(([_, amt]) => Number(amt) > 0)
                      .map(([method, amt]) => (
                        <span key={method} className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          <b className="uppercase">{method}:</b> {formatCurrency(Number(amt))}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300 text-center">
              <p className="text-xs text-gray-500">Thank you for your purchase!</p>
              <p className="text-xs text-gray-400 mt-1">Exchange within 7 days with original receipt</p>
              <p className="text-xs text-gray-400 mt-3">Powered by Meghani Connect 360</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
