'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { 
  Bell, Send, Users, MessageSquare, Plus, Edit, Trash2, CheckCircle, 
  XCircle, Clock, Smartphone, Mail, Sparkles, Filter, RefreshCw
} from 'lucide-react'
import { api } from '@/services/api'
import { Customer } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Notification {
  id: number
  customer_name: string
  customer_phone: string
  message: string
  type: 'whatsapp' | 'sms' | 'email'
  status: 'pending' | 'sent' | 'failed'
  sent_on: string | null
  error_message: string
  created_at: string
}

interface Template {
  id: number
  name: string
  template: string
  description: string
  is_active: boolean
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/40' },
  sent: { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-800/40' },
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'templates' | 'send'>('history')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  
  // Send notification state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [message, setMessage] = useState('')
  const [notifType, setNotifType] = useState<'whatsapp' | 'sms'>('whatsapp')
  const [isSending, setIsSending] = useState(false)
  
  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', template: '', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [notifRes, templatesRes, customersRes] = await Promise.all([
        api.get('/notifications/'),
        api.get('/notifications/templates/'),
        api.get('/customers/?limit=100'),
      ])
      setNotifications(notifRes.data.results || notifRes.data || [])
      setTemplates(templatesRes.data.results || templatesRes.data || [])
      setCustomers(customersRes.data.results || customersRes.data || [])
    } catch (error) {
      console.error('Failed to fetch notification data:', error)
      toast.error('Failed to load dispatch history')
    } finally {
      setLoading(false)
    }
  }

  const sendNotification = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }
    if (!message.trim()) {
      toast.error('Please draft a dispatch message')
      return
    }

    setIsSending(true)
    try {
      if (selectedCustomers.length === 1) {
        await api.post('/notifications/send/', {
          customer_id: selectedCustomers[0],
          message,
          type: notifType,
        })
      } else {
        await api.post('/notifications/bulk/', {
          customer_ids: selectedCustomers,
          message,
          type: notifType,
        })
      }
      toast.success('Dispatches queued successfully')
      setMessage('')
      setSelectedCustomers([])
      setActiveTab('history')
      fetchData()
    } catch (error) {
      toast.error('Failed to queue dispatches')
    } finally {
      setIsSending(false)
    }
  }

  const applyTemplate = (template: Template) => {
    setMessage(template.template)
    setActiveTab('send')
  }

  const openTemplateModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm({ name: template.name, template: template.template, description: template.description })
    } else {
      setEditingTemplate(null)
      setTemplateForm({ name: '', template: '', description: '' })
    }
    setShowTemplateModal(true)
  }

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.template) {
      toast.error('Template name and body are required')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingTemplate) {
        await api.patch(`/notifications/templates/${editingTemplate.id}/`, templateForm)
        toast.success('Template updated')
      } else {
        await api.post('/notifications/templates/', templateForm)
        toast.success('Template created')
      }
      setShowTemplateModal(false)
      fetchData()
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you certain you wish to delete this template?')) return
    try {
      await api.delete(`/notifications/templates/${id}/`)
      toast.success('Template deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const toggleCustomer = (id: number) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const selectAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id))
    }
  }

  const filteredCustomers = customers.filter(c => 
    !customerSearch || 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#171613] border border-[#2A261F] rounded-xl flex items-center justify-center shadow-md">
            <Bell className="w-5 h-5 text-[#C9A45C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[#F3EFE6] tracking-tight">Client Messaging & Notifications</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1E1A] text-[#C9A45C] border border-[#2A261F] font-mono">
                WhatsApp & SMS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#8D8980]">Broadcast repair ready updates, festive privileges, and bespoke concierge notifications</p>
          </div>
        </div>

        <Button 
          variant="secondary" 
          onClick={fetchData} 
          icon={<RefreshCw className={clsx('w-4 h-4 text-[#C9A45C]', loading && 'animate-spin')} />}
        >
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'history', label: 'Outbox History', icon: Bell, count: notifications.length },
          { id: 'templates', label: 'Message Templates', icon: MessageSquare, count: templates.length },
          { id: 'send', label: 'Direct & Bulk Dispatch', icon: Send },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] font-bold shadow-gold'
                : 'bg-[#171613] text-[#8D8980] border-[#2A261F] hover:text-[#F3EFE6] hover:bg-[#1F1E1A]'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#12110F] text-[#F3EFE6] border border-[#2A261F]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: Outbox History */}
      {activeTab === 'history' && (
        <div className="bg-[#171613] rounded-2xl border border-[#2A261F] overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-[#8D8980]">Loading dispatch logs...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-[#8D8980]">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#C9A45C]" />
              <p className="text-base font-serif font-bold text-[#F3EFE6]">No Dispatches Logged</p>
              <p className="text-xs text-[#8D8980] mt-1">Direct and bulk messaging dispatches will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[750px]">
                <thead className="bg-[#12110F] border-b border-[#2A261F] text-[#8D8980]">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-semibold uppercase tracking-wider">Recipient</th>
                    <th className="px-5 py-3.5 text-left font-semibold uppercase tracking-wider">Dispatch Content</th>
                    <th className="px-4 py-3.5 text-left font-semibold uppercase tracking-wider">Channel</th>
                    <th className="px-4 py-3.5 text-left font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-right font-semibold uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A261F]">
                  {notifications.map((notif) => {
                    const cfg = statusConfig[notif.status] || statusConfig.pending
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={notif.id} className="hover:bg-[#1F1E1A] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-serif font-bold text-[#F3EFE6] text-sm">{notif.customer_name || 'Client'}</p>
                          <p className="font-mono text-[11px] text-[#8D8980]">{notif.customer_phone}</p>
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="text-[#F3EFE6]/90 line-clamp-2 max-w-sm">{notif.message}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#12110F] border border-[#2A261F] text-[#E8D5A7]">
                            {notif.type}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={clsx('px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border text-[11px] font-medium', cfg.bg, cfg.color, cfg.border)}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{cfg.label}</span>
                          </span>
                          {notif.error_message && (
                            <p className="text-[10px] text-rose-400 mt-1">{notif.error_message}</p>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right font-mono text-[#8D8980]">
                          {formatDate(notif.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#8D8980]">Standardized messaging templates for repair alerts, receipts, and festival greetings</p>
            <Button onClick={() => openTemplateModal()} icon={<Plus className="w-4 h-4" />} className="shadow-gold">
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-serif font-bold text-base text-[#F3EFE6] truncate mr-2">{tpl.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button 
                        onClick={() => openTemplateModal(tpl)}
                        className="p-1.5 hover:bg-[#C9A45C]/15 text-[#C9A45C] rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteTemplate(tpl.id)}
                        className="p-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#8D8980] mb-3">{tpl.description}</p>
                  <p className="text-xs font-mono text-[#F3EFE6]/80 bg-[#12110F] border border-[#2A261F] p-3 rounded-xl mb-3 leading-relaxed">
                    {tpl.template}
                  </p>
                </div>

                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => applyTemplate(tpl)}
                  className="w-full"
                >
                  Apply in Composer
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Send New Dispatch */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clientele Selector */}
          <div className="lg:col-span-1 bg-[#171613] rounded-2xl border border-[#2A261F] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#F3EFE6]">Target Clientele</h3>
              <button 
                onClick={selectAllCustomers}
                className="text-xs text-[#C9A45C] hover:underline font-semibold"
              >
                {selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Filter clients by name or phone..."
                className="w-full px-3 py-1.5 bg-[#12110F] border border-[#2A261F] rounded-lg text-xs text-[#F3EFE6] outline-none placeholder-[#8D8980]/70"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {filteredCustomers.map((cust) => (
                <label 
                  key={cust.id} 
                  className={clsx(
                    'flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors border text-xs',
                    selectedCustomers.includes(cust.id)
                      ? 'bg-[#C9A45C]/15 border-[#C9A45C]/50 text-[#F3EFE6]'
                      : 'bg-[#12110F] border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6]'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(cust.id)}
                    onChange={() => toggleCustomer(cust.id)}
                    className="accent-[#C9A45C] w-3.5 h-3.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#F3EFE6] truncate">{cust.name}</p>
                    <p className="font-mono text-[10px] text-[#8D8980]">{cust.phone}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2 border-t border-[#2A261F] flex items-center justify-between text-xs text-[#8D8980]">
              <span>Selected Recipients:</span>
              <span className="font-mono font-bold text-[#C9A45C]">{selectedCustomers.length} clients</span>
            </div>
          </div>

          {/* Message Composer */}
          <div className="lg:col-span-2 bg-[#171613] rounded-2xl border border-[#2A261F] p-6 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-base text-[#F3EFE6]">Dispatch Composer</h3>
            
            {/* Channel Selection */}
            <div className="flex gap-3">
              {(['whatsapp', 'sms'] as const).map((type) => (
                <label 
                  key={type} 
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all border text-xs font-semibold capitalize',
                    notifType === type
                      ? 'bg-[#C9A45C] text-[#0B0B0A] border-[#C9A45C] shadow-gold'
                      : 'bg-[#12110F] border-[#2A261F] text-[#8D8980] hover:text-[#F3EFE6]'
                  )}
                >
                  <input
                    type="radio"
                    name="notifType"
                    value={type}
                    checked={notifType === type}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="hidden"
                  />
                  <span>{type === 'whatsapp' ? 'WhatsApp API Gateway' : 'Transactional SMS'}</span>
                </label>
              ))}
            </div>

            {/* Quick Templates */}
            {templates.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs text-[#8D8980] font-medium">Insert Template:</span>
                <div className="flex flex-wrap gap-1.5">
                  {templates.slice(0, 6).map((t) => (
                    <button 
                      key={t.id} 
                      onClick={() => setMessage(t.template)}
                      className="px-2.5 py-1 bg-[#12110F] border border-[#2A261F] hover:border-[#C9A45C]/40 text-[#E8D5A7] rounded-lg text-xs transition"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F3EFE6]">Message Body</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3.5 py-3 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none leading-relaxed"
                placeholder="Draft bespoke concierge message... Supports {name}, {phone}, {invoice_number} placeholders"
              />
              <div className="flex items-center justify-between text-[11px] text-[#8D8980] font-mono">
                <span>Variables: {'{name}'}, {'{phone}'}, {'{invoice_number}'}</span>
                <span>{message.length} characters</span>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-2">
              <Button 
                onClick={sendNotification} 
                loading={isSending} 
                disabled={selectedCustomers.length === 0 || !message.trim()} 
                icon={<Send className="w-4 h-4" />}
                className="shadow-gold"
              >
                Send to {selectedCustomers.length} Recipient(s)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      <Modal 
        isOpen={showTemplateModal} 
        onClose={() => setShowTemplateModal(false)} 
        title={editingTemplate ? 'Update Message Template' : 'Create Dispatch Template'}
        description="Standardized broadcast wording with personalization variable placeholders"
      >
        <div className="space-y-4">
          <Input
            label="Template Title *"
            value={templateForm.name}
            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            placeholder="e.g. VIP Birthday Privilege"
          />

          <Input
            label="Contextual Description"
            value={templateForm.description}
            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
            placeholder="e.g. Dispatched to VIP patrons celebrating their milestone"
          />

          <div>
            <label className="block text-xs font-medium text-[#F3EFE6] mb-1.5">Message Body *</label>
            <textarea
              value={templateForm.template}
              onChange={(e) => setTemplateForm({ ...templateForm, template: e.target.value })}
              rows={4}
              className="w-full px-3.5 py-2.5 bg-[#12110F] border border-[#2A261F] rounded-xl focus:border-[#C9A45C] outline-none text-xs text-[#F3EFE6] resize-none"
              placeholder="Greetings {name}, your timepiece is now ready for collection at Meghani Watch Co..."
            />
            <p className="text-[11px] text-[#8D8980] mt-1 font-mono">Placeholders: {'{name}'}, {'{phone}'}, {'{invoice_number}'}</p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2A261F]">
            <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} loading={isSubmitting} className="shadow-gold">
              {editingTemplate ? 'Commit Template' : 'Save Template'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
