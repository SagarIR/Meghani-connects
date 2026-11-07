'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Bell, Send, Users, MessageSquare, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { api } from '@/services/api'
import { Customer } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

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
  pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
  sent: { label: 'Sent', variant: 'success' as const, icon: CheckCircle },
  failed: { label: 'Failed', variant: 'danger' as const, icon: XCircle },
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'templates' | 'send'>('history')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  
  // Send notification state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
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
      setNotifications(notifRes.data.results || notifRes.data)
      setTemplates(templatesRes.data.results || templatesRes.data)
      setCustomers(customersRes.data.results || customersRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendNotification = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer')
      return
    }
    if (!message.trim()) {
      toast.error('Please enter a message')
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
      toast.success('Notification(s) sent')
      setMessage('')
      setSelectedCustomers([])
      fetchData()
    } catch (error) {
      toast.error('Failed to send notification')
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
      toast.error('Name and template are required')
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
    if (!confirm('Delete this template?')) return
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
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map(c => c.id))
    }
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Send WhatsApp/SMS to customers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'history', label: 'History', icon: Bell },
          { id: 'templates', label: 'Templates', icon: MessageSquare },
          { id: 'send', label: 'Send New', icon: Send },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 sm:h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 sm:py-12 px-4">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-sm sm:text-base text-gray-500">No notifications sent yet</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notifications.map((notif) => {
                      const StatusIcon = statusConfig[notif.status]?.icon || Clock
                      return (
                        <tr key={notif.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 text-sm">{notif.customer_name}</p>
                            <p className="text-xs text-gray-500">{notif.customer_phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700 text-sm line-clamp-2 max-w-xs">{notif.message}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="info">{notif.type.toUpperCase()}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`w-4 h-4 ${notif.status === 'sent' ? 'text-green-500' : notif.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`} />
                              <Badge variant={statusConfig[notif.status]?.variant}>{statusConfig[notif.status]?.label}</Badge>
                            </div>
                            {notif.error_message && (
                              <p className="text-xs text-red-500 mt-1">{notif.error_message}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(notif.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile List */}
              <div className="md:hidden divide-y divide-gray-100">
                {notifications.map((notif) => {
                  const StatusIcon = statusConfig[notif.status]?.icon || Clock
                  return (
                    <div key={notif.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm">{notif.customer_name}</p>
                          <p className="text-xs text-gray-500">{notif.customer_phone}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <StatusIcon className={`w-3.5 h-3.5 ${notif.status === 'sent' ? 'text-green-500' : notif.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`} />
                          <Badge variant={statusConfig[notif.status]?.variant}>{statusConfig[notif.status]?.label}</Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 text-xs line-clamp-2 mb-2">{notif.message}</p>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="info">{notif.type.toUpperCase()}</Badge>
                        <span className="text-gray-400">{formatDate(notif.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openTemplateModal()} className="text-sm">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">New Template</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {templates.map((template) => (
              <div key={template.id} className="card p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate mr-2">{template.name}</h3>
                  <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openTemplateModal(template)}>
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 line-clamp-1">{template.description}</p>
                <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 line-clamp-3">{template.template}</p>
                <Button variant="secondary" size="sm" onClick={() => applyTemplate(template)} className="w-full text-xs sm:text-sm">
                  Use Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Customer Selection */}
          <div className="lg:col-span-1 card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Select Customers</h3>
              <Button variant="ghost" size="sm" onClick={selectAllCustomers} className="text-xs sm:text-sm">
                {selectedCustomers.length === customers.length ? 'Deselect' : 'Select All'}
              </Button>
            </div>
            <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-1.5 sm:space-y-2">
              {customers.map((customer) => (
                <label key={customer.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${selectedCustomers.includes(customer.id) ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => toggleCustomer(customer.id)}
                    className="w-4 h-4 text-primary-600 rounded flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{customer.name}</p>
                    <p className="text-xs text-gray-500 truncate">{customer.phone}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">{selectedCustomers.length} customer(s) selected</p>
          </div>

          {/* Message Composer */}
          <div className="lg:col-span-2 card p-3 sm:p-4">
            <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Compose Message</h3>
            
            {/* Type Selection */}
            <div className="flex gap-2 sm:gap-4 mb-3 sm:mb-4">
              {(['whatsapp', 'sms'] as const).map((type) => (
                <label key={type} className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm ${notifType === type ? 'bg-primary-100 border border-primary-300' : 'bg-gray-100'}`}>
                  <input
                    type="radio"
                    name="notifType"
                    value={type}
                    checked={notifType === type}
                    onChange={(e) => setNotifType(e.target.value as any)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600"
                  />
                  <span className="font-medium capitalize">{type}</span>
                </label>
              ))}
            </div>

            {/* Quick Templates */}
            {templates.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">Quick Templates:</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {templates.slice(0, 5).map((t) => (
                    <Button key={t.id} variant="ghost" size="sm" onClick={() => setMessage(t.template)} className="text-xs sm:text-sm">
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                placeholder="Enter your message here... Use {name} for customer name"
              />
              <p className="text-xs text-gray-500 mt-1">{message.length} characters</p>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <Button onClick={sendNotification} isLoading={isSending} disabled={selectedCustomers.length === 0 || !message.trim()} className="w-full sm:w-auto text-sm">
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Send to {selectedCustomers.length} Customer(s)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title={editingTemplate ? 'Edit Template' : 'New Template'}>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <input
              type="text"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="e.g., Birthday Wish"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="Short description"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Template Message *</label>
            <textarea
              value={templateForm.template}
              onChange={(e) => setTemplateForm({ ...templateForm, template: e.target.value })}
              rows={4}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              placeholder="Use {name} for customer name..."
            />
            <p className="text-[10px] sm:text-sm text-gray-500 mt-1">Variables: {'{name}'}, {'{phone}'}, {'{invoice_number}'}</p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => setShowTemplateModal(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={saveTemplate} isLoading={isSubmitting} className="w-full sm:w-auto">{editingTemplate ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
