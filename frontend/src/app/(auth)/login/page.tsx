'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Watch, Lock, User, Sparkles, ArrowRight, Shield, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
})

type LoginForm = {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.username, data.password)
      toast.success('Authenticated to Meghani Connect 360')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid staff credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0B0B0A]">
      {/* Left Panel - Luxury Boutique Heritage */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B0B0A] border-r border-[#2A261F] overflow-hidden">
        {/* Subtle radial luxury glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C9A45C]/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#C9A45C]/5 rounded-full blur-[140px]"></div>
          {/* Guilloche dial circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-[#2A261F]/60 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#2A261F]/40 rounded-full border-dashed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border border-[#C9A45C]/20 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          {/* Header Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3.5"
          >
            <div className="w-12 h-12 bg-[#171613] border border-[#C9A45C]/40 rounded-xl flex items-center justify-center shadow-gold">
              <Watch className="w-6 h-6 text-[#C9A45C]" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-wider text-[#F3EFE6]">MEGHANI WATCH CO.</h1>
              <p className="text-[10px] tracking-[0.25em] text-[#C9A45C] uppercase font-mono">EST. 1984 • VADODARA, GUJARAT</p>
            </div>
          </motion.div>

          {/* Central Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-lg space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F1E1A] border border-[#2A261F] text-xs font-mono text-[#E8D5A7]">
              <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
              <span>Operations Desk & Staff Portal</span>
            </div>

            <h2 className="text-4xl font-serif font-bold text-[#F3EFE6] leading-tight tracking-tight">
              Enterprise Horology & Boutique POS System
            </h2>

            <p className="text-sm text-[#8D8980] leading-relaxed">
              Unified management for luxury watch inventories, master watchmaker atelier servicing, 
              point-of-sale transactions, and VIP client relationships.
            </p>

            {/* Modules Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                'POS Terminal', 'Timepiece Vault', 'Atelier Repairs', 
                'VIP Clientele CRM', 'Fiscal Ledgers', 'Web Showcase CMS'
              ].map((mod, i) => (
                <span
                  key={mod}
                  className="px-3 py-1 bg-[#171613] border border-[#2A261F] rounded-lg text-xs font-medium text-[#F3EFE6]"
                >
                  {mod}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Security Assurance */}
          <div className="flex items-center gap-2 text-xs text-[#8D8980] font-mono">
            <Shield className="w-4 h-4 text-[#C9A45C]" />
            <span>Encrypted Session • Role-Based Access Control Protected</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Staff Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0B0B0A]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#171613] border border-[#2A261F] rounded-3xl p-8 sm:p-10 shadow-2xl"
        >
          {/* Mobile Brand Emblem */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center text-center">
            <div className="w-12 h-12 bg-[#1F1E1A] border border-[#C9A45C]/40 rounded-xl flex items-center justify-center text-[#C9A45C]">
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-[#F3EFE6]">MEGHANI WATCH CO.</h1>
              <p className="text-[10px] text-[#C9A45C] font-mono tracking-widest">EST. 1984</p>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-serif font-bold text-[#F3EFE6]">Staff Authentication</h2>
            <p className="text-xs text-[#8D8980] mt-1">Authenticate to access the boutique operations terminal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Staff Username"
              placeholder="e.g. admin or staff"
              icon={<User className="w-4 h-4 text-[#8D8980]" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label="Staff Password"
              type="password"
              placeholder="••••••••••••"
              icon={<Lock className="w-4 h-4 text-[#8D8980]" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="mt-2 shadow-gold"
            >
              Sign In to Register
            </Button>
          </form>

          {/* Demo Credentials Guide */}
          <div className="mt-8 p-4 bg-[#12110F] rounded-xl border border-[#2A261F] text-xs">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C9A45C] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[#F3EFE6]">Boutique Staff Credentials:</p>
                <div className="mt-1 space-y-0.5 font-mono text-[#8D8980]">
                  <p>Username: <span className="text-[#C9A45C] font-bold">admin</span> | Password: <span className="text-[#C9A45C] font-bold">admin123</span></p>
                  <p>Username: <span className="text-[#E8D5A7]">staff</span> | Password: <span className="text-[#E8D5A7]">staff123</span></p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-[#8D8980]">
            &copy; {new Date().getFullYear()} Meghani Watch Co. • Vadodara, Gujarat
          </p>
        </motion.div>
      </div>
    </div>
  )
}
