'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, Search, Filter, AlertTriangle, Clock, 
  CheckCircle2, XCircle, Wrench, RefreshCw, Eye, FileText,
  User, Phone, Calendar, ShieldAlert, Sparkles
} from 'lucide-react'
import { api } from '@/services/api'
import { Warranty, WarrantyClaim } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [claims, setClaims] = useState<WarrantyClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'certificates' | 'claims'>('certificates')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Modals
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showVoidModal, setShowVoidModal] = useState(false)

  // Claim Form State
  const [claimIssue, setClaimIssue] = useState('')
  const [claimRepairId, setClaimRepairId] = useState<number | ''>('')
  const [claimCoveredAmount, setClaimCoveredAmount] = useState('0.00')
  const [submittingClaim, setSubmittingClaim] = useState(false)

  // Void Form State
  const [voidReason, setVoidReason] = useState('')
  const [submittingVoid, setSubmittingVoid] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [warrantiesRes, claimsRes] = await Promise.all([
        api.get('/sales/warranties/'),
        api.get('/sales/claims/')
      ])
      setWarranties(warrantiesRes.data?.results || warrantiesRes.data || [])
      setClaims(claimsRes.data?.results || claimsRes.data || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load warranty data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Stats
  const stats = useMemo(() => {
    const active = warranties.filter(w => w.status === 'active' && !w.is_expired).length
    const expiring = warranties.filter(w => w.status === 'active' && !w.is_expired && w.days_remaining <= 30).length
    const claimed = warranties.filter(w => w.status === 'claimed' || (w.claims && w.claims.length > 0)).length
    const voided = warranties.filter(w => w.status === 'voided').length
    return { active, expiring, claimed, voided, totalClaims: claims.length }
  }, [warranties, claims])

  // Filtered Warranties
  const filteredWarranties = useMemo(() => {
    return warranties.filter(w => {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        (w.warranty_code && w.warranty_code.toLowerCase().includes(query)) ||
        w.product_name.toLowerCase().includes(query) ||
        w.customer_name.toLowerCase().includes(query) ||
        (w.customer_phone && w.customer_phone.includes(query)) ||
        (w.serial_number && w.serial_number.toLowerCase().includes(query)) ||
        (w.sale_invoice_number && w.sale_invoice_number.toLowerCase().includes(query))

      let matchesStatus = true
      if (selectedStatus === 'active') matchesStatus = w.status === 'active' && !w.is_expired
      else if (selectedStatus === 'expiring') matchesStatus = w.status === 'active' && !w.is_expired && w.days_remaining <= 30
      else if (selectedStatus === 'claimed') matchesStatus = w.status === 'claimed'
      else if (selectedStatus === 'expired') matchesStatus = w.is_expired || w.status === 'expired'
      else if (selectedStatus === 'voided') matchesStatus = w.status === 'voided'

      return matchesSearch && matchesStatus
    })
  }, [warranties, searchQuery, selectedStatus])

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const query = searchQuery.toLowerCase()
      return (
        c.claim_number.toLowerCase().includes(query) ||
        c.issue_description.toLowerCase().includes(query) ||
        (c.repair_ticket && c.repair_ticket.toLowerCase().includes(query))
      )
    })
  }, [claims, searchQuery])

  // Submit Claim
  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWarranty) return
    if (!claimIssue.trim()) {
      toast.error('Documented issue description is required.')
      return
    }

    setSubmittingClaim(true)
    try {
      await api.post(`/sales/warranties/${selectedWarranty.id}/claim/`, {
        issue_description: claimIssue.trim(),
        repair_id: claimRepairId ? Number(claimRepairId) : null,
        covered_amount: claimCoveredAmount
      })
      toast.success('Warranty claim approved and registered!')
      setShowClaimModal(false)
      setShowDetailModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || JSON.stringify(err.response?.data || 'Failed to file claim.'))
    } finally {
      setSubmittingClaim(false)
    }
  }

  // Submit Void
  const handleVoidWarranty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWarranty) return
    if (!voidReason.trim()) {
      toast.error('Reason for voiding warranty is required.')
      return
    }

    setSubmittingVoid(true)
    try {
      await api.post(`/sales/warranties/${selectedWarranty.id}/void/`, {
        reason: voidReason.trim()
      })
      toast.success('Warranty certificate voided.')
      setShowVoidModal(false)
      setShowDetailModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to void warranty.')
    } finally {
      setSubmittingVoid(false)
    }
  }

  // Status Badge Helper
  const getWarrantyBadge = (w: Warranty) => {
    if (w.status === 'voided') return <Badge variant="danger">Voided</Badge>
    if (w.status === 'claimed') return <Badge variant="primary">Claimed</Badge>
    if (w.is_expired || w.status === 'expired') return <Badge variant="gray">Expired</Badge>
    if (w.days_remaining <= 30) return <Badge variant="warning">Expiring Soon ({w.days_remaining}d)</Badge>
    return <Badge variant="success">Active ({w.days_remaining}d left)</Badge>
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-amber-600 dark:text-amber-500" />
            Warranty & Claims Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Horological warranty certificates, manufacturer guarantees, and service claim tracking.
          </p>
        </div>

        <Button variant="secondary" onClick={fetchData} title="Refresh">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh Records
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Warranties</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.active}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiring (&lt;30 Days)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.expiring}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Claims</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalClaims}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Voided Certificates</p>
            <p className="text-2xl font-bold text-slate-500 mt-1">{stats.voided}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => { setActiveTab('certificates'); setSearchQuery(''); }}
            className={clsx(
              activeTab === 'certificates'
                ? 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Warranty Certificates
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {warranties.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('claims'); setSearchQuery(''); }}
            className={clsx(
              activeTab === 'claims'
                ? 'border-amber-600 text-amber-600 dark:border-amber-500 dark:text-amber-500'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
            )}
          >
            <Wrench className="w-4 h-4" />
            Service Claims History
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {claims.length}
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search certificate #, customer, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Warranty Statuses</option>
                <option value="active">Active & Covered</option>
                <option value="expiring">Expiring Soon (&lt;30d)</option>
                <option value="claimed">Claimed</option>
                <option value="expired">Expired</option>
                <option value="voided">Voided</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Certificate #</th>
                  <th className="py-3 px-4">Watch / Product</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Coverage Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWarranties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No warranty certificates found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredWarranties.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-amber-600 dark:text-amber-500">
                        {w.warranty_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {w.product_name}
                        {w.product_brand && <span className="block text-xs text-slate-400 font-normal">{w.product_brand}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{w.customer_name}</p>
                        {w.customer_phone && <p className="text-xs text-slate-400 font-mono">{w.customer_phone}</p>}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {w.sale_invoice_number || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(w.start_date).toLocaleDateString()} → {new Date(w.expiry_date).toLocaleDateString()}
                        <span className="block text-[11px] text-slate-400">({w.warranty_months} months)</span>
                      </td>
                      <td className="py-3 px-4">
                        {getWarrantyBadge(w)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => { setSelectedWarranty(w); setShowDetailModal(true); }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                            title="View Certificate Terms"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {w.status !== 'voided' && !w.is_expired && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setSelectedWarranty(w); setClaimIssue(''); setShowClaimModal(true); }}
                            >
                              File Claim
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE CLAIMS */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Claim #</th>
                  <th className="py-3 px-4">Claim Date</th>
                  <th className="py-3 px-4">Issue Reported</th>
                  <th className="py-3 px-4">Covered Amount</th>
                  <th className="py-3 px-4">Repair Ticket</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No warranty claims logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-amber-600 dark:text-amber-500">
                        {c.claim_number}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(c.claim_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {c.issue_description}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(c.covered_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {c.repair_ticket || 'In-House Service'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="primary">{c.status_display}</Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {c.created_by_name || 'Staff'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL & TERMS */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Certificate: ${selectedWarranty?.warranty_code}`}
        size="lg"
      >
        {selectedWarranty && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-slate-400 uppercase tracking-wider text-[10px]">Product</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedWarranty.product_name}</p>
                <p className="text-slate-500">{selectedWarranty.product_brand}</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase tracking-wider text-[10px]">Customer</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedWarranty.customer_name}</p>
                <p className="text-slate-500 font-mono">{selectedWarranty.customer_phone}</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase tracking-wider text-[10px]">Duration</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedWarranty.warranty_months} Months</p>
                <p className="text-slate-500">Expires: {new Date(selectedWarranty.expiry_date).toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-slate-400 uppercase tracking-wider text-[10px]">Status</p>
                <div className="mt-1">{getWarrantyBadge(selectedWarranty)}</div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Terms & Conditions
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {selectedWarranty.terms}
              </div>
            </div>

            {selectedWarranty.claims && selectedWarranty.claims.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Claims History
                </p>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                  {selectedWarranty.claims.map(claim => (
                    <div key={claim.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-medium text-amber-600">{claim.claim_number}</p>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">{claim.issue_description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">₹{Number(claim.covered_amount).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400">{new Date(claim.claim_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
              {selectedWarranty.status !== 'voided' && (
                <button
                  type="button"
                  onClick={() => { setShowVoidModal(true); }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                >
                  Void Warranty Certificate
                </button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
                {selectedWarranty.status !== 'voided' && !selectedWarranty.is_expired && (
                  <Button variant="primary" onClick={() => { setShowDetailModal(false); setShowClaimModal(true); }}>
                    File Claim
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: FILE CLAIM */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title={`File Warranty Claim: ${selectedWarranty?.warranty_code}`}
      >
        {selectedWarranty && (
          <form onSubmit={handleFileClaim} className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
              <strong>Covered Watch:</strong> {selectedWarranty.product_name} ({selectedWarranty.product_brand})
              <br />
              <strong>Customer:</strong> {selectedWarranty.customer_name}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Defect / Issue Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={claimIssue}
                onChange={e => setClaimIssue(e.target.value)}
                placeholder="e.g. Movement stopping intermittently, crown loose, date mechanism failure..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Covered Service Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={claimCoveredAmount}
                onChange={e => setClaimCoveredAmount(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowClaimModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submittingClaim}>
                {submittingClaim ? 'Submitting...' : 'Approve & Register Claim'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: VOID WARRANTY */}
      <Modal
        isOpen={showVoidModal}
        onClose={() => setShowVoidModal(false)}
        title="Administrative Void of Warranty"
      >
        <form onSubmit={handleVoidWarranty} className="space-y-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300">
            Voiding a warranty permanently revokes coverage and prevents future claims. Document the exact non-warranty event (e.g. unauthorized third-party tampering, customer water abuse, or full merchandise return refund).
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Documented Void Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              placeholder="e.g. Watch opened by uncertified third party workshop; balance spring damaged..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowVoidModal(false)}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={submittingVoid}>
              {submittingVoid ? 'Voiding...' : 'Confirm Void'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
