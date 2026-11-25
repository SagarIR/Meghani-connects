'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, Search, Filter, AlertTriangle, Clock, 
  CheckCircle2, XCircle, Wrench, RefreshCw, Eye, FileText,
  User, Phone, Calendar, ShieldAlert, Sparkles, ChevronRight
} from 'lucide-react'
import { api } from '@/services/api'
import { Warranty, WarrantyClaim } from '@/types'
import { usePreferences } from '@/context/PreferencesContext'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ExportButton from '@/components/ui/ExportButton'
import { warrantyExportColumns, warrantyClaimExportColumns } from '@/utils/export'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function WarrantiesPage() {
  const { t } = usePreferences()
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
      toast.success('Warranty certificate permanently voided.')
      setShowVoidModal(false)
      setShowDetailModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to void warranty.')
    } finally {
      setSubmittingVoid(false)
    }
  }

  const getWarrantyBadge = (w: Warranty) => {
    if (w.status === 'voided') {
      return <Badge variant="danger">{t('voided', 'Voided')}</Badge>
    }
    if (w.is_expired) {
      return <Badge variant="gray">{t('expired', 'Expired')}</Badge>
    }
    if (w.days_remaining <= 30) {
      return <Badge variant="warning">{w.days_remaining} {t('daysLeft', 'days left')}</Badge>
    }
    if (w.status === 'claimed') {
      return <Badge variant="info">{t('claimFiled', 'Claim Filed')}</Badge>
    }
    return <Badge variant="success">{t('activeCoverage', 'Active Coverage')}</Badge>
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0))
  }

  if (loading) {
    return (
      <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-16 text-center shadow-xl">
        <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-[#8D8980]">Loading warranty records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">{t('warrantiesClaims', 'Warranties & Claims')}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                {warranties.length} {t('warranties', 'certificates')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">
              {t('warrantiesClaims', 'Horological warranty certificates, manufacturer guarantees, and service claim tracking')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {activeTab === 'certificates' ? (
            <ExportButton 
              data={filteredWarranties} 
              columns={warrantyExportColumns} 
              filename={`meghani_warranties_${new Date().toISOString().split('T')[0]}`} 
            />
          ) : (
            <ExportButton 
              data={filteredClaims} 
              columns={warrantyClaimExportColumns} 
              filename={`meghani_warranty_claims_${new Date().toISOString().split('T')[0]}`} 
            />
          )}
          <Button variant="secondary" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh Records
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">{t('activeWarranties', 'Active Warranties')}</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
            {stats.active}
          </p>
          <span className="text-[11px] text-emerald-500/80 mt-0.5 block">{t('underActiveCoverage', 'Under active coverage')}</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">{t('expiringWarranties', 'Expiring (<30 Days)')}</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">
            {stats.expiring}
          </p>
          <span className="text-[11px] text-amber-500/80 mt-0.5 block">{t('renewalDue', 'Renewal / checkup due')}</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">{t('totalClaims', 'Total Claims')}</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#C9A45C] mt-1">
            {stats.totalClaims}
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">{t('serviceClaimRepairs', 'Service & claim repairs')}</span>
        </div>

        <div className="bg-[#171613] border border-[#2A261F] rounded-xl p-4">
          <span className="text-[11px] text-[#8D8980] uppercase tracking-wider block font-medium">{t('voidedCertificates', 'Voided Certificates')}</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#8D8980] mt-1">
            {stats.voided}
          </p>
          <span className="text-[11px] text-[#8D8980] mt-0.5 block">{t('revokedCoverage', 'Revoked or lapsed coverage')}</span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2A261F] pb-3 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('certificates'); setSearchQuery(''); }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
            activeTab === 'certificates'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
          )}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('warrantyCertificates', 'Warranty Certificates')}</span>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-[11px] font-mono',
            activeTab === 'certificates' ? 'bg-[#0B0B0A]/20 text-[#0B0B0A]' : 'bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F]'
          )}>
            {warranties.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('claims'); setSearchQuery(''); }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
            activeTab === 'claims'
              ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-md'
              : 'bg-[#12110F] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
          )}
        >
          <Wrench className="w-4 h-4" />
          <span>{t('serviceClaims', 'Service Claims & Filings')}</span>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-[11px] font-mono',
            activeTab === 'claims' ? 'bg-[#0B0B0A]/20 text-[#0B0B0A]' : 'bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F]'
          )}>
            {claims.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D8980] group-focus-within:text-[#C9A45C] transition-colors" />
                <input
                  type="text"
                  placeholder={t('searchWarrantyPlaceholder', 'Search certificate #, customer name, phone, serial, invoice...')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                            text-[#F3EFE6] placeholder-[#8D8980]/70 text-sm
                            focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                            transition-all outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="w-full sm:w-56">
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl 
                              text-[#F3EFE6] text-sm focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C]
                              outline-none cursor-pointer"
                  >
                    <option value="all">{t('allWarrantyStatuses', 'All Warranty Statuses')}</option>
                    <option value="active">{t('activeCoverage', 'Active & Covered')}</option>
                    <option value="expiring">{t('expiringWarranties', 'Expiring Soon (<30d)')}</option>
                    <option value="claimed">{t('claimFiled', 'Claim Filed')}</option>
                    <option value="expired">{t('expired', 'Expired')}</option>
                    <option value="voided">{t('voided', 'Voided')}</option>
                  </select>
                </div>

                <button
                  onClick={fetchData}
                  className="p-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-[#8D8980] hover:text-[#C9A45C] hover:border-[#C9A45C]/50 transition-colors"
                  title={t('refreshRecords', 'Refresh Data')}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Certificates Table */}
          {filteredWarranties.length === 0 ? (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-[#8D8980]" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">{t('noWarrantiesFound', 'No Warranty Certificates Found')}</h3>
              <p className="text-sm text-[#8D8980]">
                {t('noWarrantiesFoundDesc', 'No certificates match your search query or status filter. Certificates are automatically generated upon watch sales.')}
              </p>
            </div>
          ) : (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-[#12110F] border-b border-[#2A261F]">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">{t('certificateCol', 'Certificate #')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">{t('productSerialCol', 'Watch / Product')}</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">{t('customerPhoneCol', 'Customer')}</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">{t('invoiceNumberCol', 'Invoice Ref')}</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">{t('coveragePeriodCol', 'Coverage Period')}</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">{t('statusCol', 'Status')}</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">{t('actionsCol', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A261F]">
                    {filteredWarranties.map(w => (
                      <tr key={w.id} className="hover:bg-[#1F1E1A] transition-colors group">
                        <td className="px-5 py-4">
                          <span 
                            className="font-mono font-bold text-sm text-[#C9A45C] group-hover:underline cursor-pointer"
                            onClick={() => { setSelectedWarranty(w); setShowDetailModal(true); }}
                          >
                            {w.warranty_code}
                          </span>
                          {w.serial_number && (
                            <span className="block font-mono text-[11px] text-[#8D8980]">
                              SN: {w.serial_number}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-serif font-semibold text-sm text-[#F3EFE6]">
                            {w.product_name}
                          </p>
                          {w.product_brand && (
                            <p className="text-xs text-[#8D8980]">{w.product_brand}</p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-serif font-medium text-sm text-[#F3EFE6]">
                            {w.customer_name}
                          </p>
                          {w.customer_phone && (
                            <p className="text-xs text-[#8D8980] font-mono mt-0.5">{w.customer_phone}</p>
                          )}
                        </td>

                        <td className="px-4 py-4 font-mono text-xs text-[#E8D5A7]">
                          {w.sale_invoice_number || '—'}
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-xs font-mono text-[#F3EFE6]">
                            {new Date(w.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {new Date(w.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <span className="text-[11px] text-[#8D8980] font-mono mt-0.5 block">
                            ({w.warranty_months} months policy)
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {getWarrantyBadge(w)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedWarranty(w); setShowDetailModal(true); }}
                              className="p-2 bg-[#12110F] border border-[#2A261F] text-[#8D8980] hover:text-[#C9A45C] hover:border-[#C9A45C]/50 rounded-xl transition-colors"
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERVICE CLAIMS */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] p-12 text-center shadow-xl">
              <div className="w-16 h-16 mx-auto bg-[#1F1E1A] border border-[#2A261F] rounded-2xl flex items-center justify-center mb-4">
                <Wrench className="w-8 h-8 text-[#8D8980]" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#F3EFE6] mb-1">No Warranty Claims Logged</h3>
              <p className="text-sm text-[#8D8980]">
                Warranty claims filed by technicians or cashiers will be tracked here with audited service cost coverage.
              </p>
            </div>
          ) : (
            <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-[#12110F] border-b border-[#2A261F]">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Claim #</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Claim Date</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Issue Reported</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Covered Amount</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Repair Ticket</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3.5 text-right text-xs font-semibold text-[#8D8980] uppercase tracking-wider">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A261F]">
                    {filteredClaims.map(c => (
                      <tr key={c.id} className="hover:bg-[#1F1E1A] transition-colors group">
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-sm text-[#C9A45C]">
                            {c.claim_number}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-mono text-[#8D8980]">
                          {new Date(c.claim_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#F3EFE6] max-w-sm truncate">
                          {c.issue_description}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(c.covered_amount)}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-[#E8D5A7]">
                          {c.repair_ticket || 'In-House Service'}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="primary">{c.status_display}</Badge>
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-[#8D8980]">
                          {c.created_by_name || 'Staff Member'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            <div className="p-4 bg-[#12110F] rounded-xl border border-[#2A261F] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-[#8D8980] uppercase tracking-wider text-[10px]">Product</p>
                <p className="font-serif font-semibold text-[#F3EFE6] mt-0.5">{selectedWarranty.product_name}</p>
                <p className="text-[#8D8980]">{selectedWarranty.product_brand}</p>
              </div>

              <div>
                <p className="text-[#8D8980] uppercase tracking-wider text-[10px]">Customer</p>
                <p className="font-serif font-semibold text-[#F3EFE6] mt-0.5">{selectedWarranty.customer_name}</p>
                <p className="text-[#8D8980] font-mono">{selectedWarranty.customer_phone}</p>
              </div>

              <div>
                <p className="text-[#8D8980] uppercase tracking-wider text-[10px]">Duration</p>
                <p className="font-mono font-semibold text-[#F3EFE6] mt-0.5">{selectedWarranty.warranty_months} Months</p>
                <p className="text-[#8D8980] font-mono text-[11px]">
                  Expires: {new Date(selectedWarranty.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div>
                <p className="text-[#8D8980] uppercase tracking-wider text-[10px]">Status</p>
                <div className="mt-1">{getWarrantyBadge(selectedWarranty)}</div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1.5">
                Terms & Conditions
              </p>
              <div className="p-3.5 bg-[#12110F] border border-[#2A261F] rounded-xl text-xs text-[#8D8980] leading-relaxed font-sans whitespace-pre-line max-h-48 overflow-y-auto">
                {selectedWarranty.terms}
              </div>
            </div>

            {selectedWarranty.claims && selectedWarranty.claims.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1.5">
                  Claims History
                </p>
                <div className="divide-y divide-[#2A261F] border border-[#2A261F] rounded-xl overflow-hidden bg-[#12110F]">
                  {selectedWarranty.claims.map(claim => (
                    <div key={claim.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-bold text-[#C9A45C]">{claim.claim_number}</p>
                        <p className="text-[#F3EFE6] mt-0.5">{claim.issue_description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-400">{formatCurrency(claim.covered_amount)}</p>
                        <p className="text-[10px] text-[#8D8980] font-mono">{new Date(claim.claim_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-[#2A261F]">
              {selectedWarranty.status !== 'voided' && (
                <button
                  type="button"
                  onClick={() => setShowVoidModal(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  Void Warranty Certificate
                </button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
                {selectedWarranty.status !== 'voided' && !selectedWarranty.is_expired && (
                  <Button onClick={() => { setShowDetailModal(false); setShowClaimModal(true); }} className="shadow-gold">
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
            <div className="p-3.5 bg-[#1F1E1A] rounded-xl border border-[#C9A45C]/30 text-xs text-[#E8D5A7] leading-relaxed">
              <span className="font-bold text-[#F3EFE6]">Covered Timepiece:</span> {selectedWarranty.product_name} ({selectedWarranty.product_brand})
              <br />
              <span className="font-bold text-[#F3EFE6]">Customer:</span> {selectedWarranty.customer_name}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
                Defect / Issue Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={claimIssue}
                onChange={e => setClaimIssue(e.target.value)}
                placeholder="e.g. Movement stopping intermittently, crown loose, date mechanism failure..."
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-[#C9A45C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
                Covered Service Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={claimCoveredAmount}
                onChange={e => setClaimCoveredAmount(e.target.value)}
                className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm font-mono text-[#F3EFE6] focus:border-[#C9A45C] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2A261F]">
              <Button variant="secondary" type="button" onClick={() => setShowClaimModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingClaim} className="shadow-gold">
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
          <div className="p-3.5 bg-rose-950/20 rounded-xl border border-rose-800/30 text-xs text-rose-300 leading-relaxed">
            Voiding a warranty permanently revokes coverage and prevents future claims. Document the exact non-warranty event (e.g. unauthorized third-party tampering, customer water abuse, or full merchandise return refund).
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D8980] uppercase tracking-wider mb-1">
              Documented Void Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              placeholder="e.g. Watch opened by uncertified third party workshop; balance spring damaged..."
              className="w-full bg-[#12110F] border border-[#2A261F] rounded-xl p-2.5 text-sm text-[#F3EFE6] placeholder-[#8D8980]/50 focus:border-rose-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2A261F]">
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
