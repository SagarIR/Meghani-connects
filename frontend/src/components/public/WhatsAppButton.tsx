'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { MEGHANI_STORE_INFO } from '@/services/publicCatalogue';

const luxuryEase = [0.16, 1, 0.3, 1] as const;

interface WhatsAppButtonProps {
  phone?: string;
}

export default function WhatsAppButton({ phone = MEGHANI_STORE_INFO.whatsapp }: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(true);

  const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(
    'Hello Meghani Watch Co., I am browsing your website and would like help with watches.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Tooltip Pill with AnimatePresence */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: luxuryEase }}
            className="hidden sm:flex items-center gap-2 bg-[#171613] text-[#F3EFE6] text-xs py-2 px-3.5 rounded-full border border-[#C9A45C]/40 shadow-2xl shadow-black/80"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium">Need help choosing a watch? Chat with us on WhatsApp</span>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-[#8D8980] hover:text-[#F3EFE6] ml-1 p-0.5 transition-colors"
              aria-label="Dismiss tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.a
        whileHover={{ scale: 1.06, transition: { duration: 0.25, ease: luxuryEase } }}
        whileTap={{ scale: 0.93 }}
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Meghani Watch Co. on WhatsApp"
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-2xl shadow-[#25D366]/30 ring-2 ring-white/20 hover:ring-[#C9A45C] transition-colors"
      >
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/20 animate-pulse-soft -z-10" />
        <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
      </motion.a>
    </div>
  );
}
