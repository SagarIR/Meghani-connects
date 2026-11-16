'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { MEGHANI_STORE_INFO } from '@/services/publicCatalogue';

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  const whatsappHref = `https://wa.me/${MEGHANI_STORE_INFO.whatsapp}?text=${encodeURIComponent(
    'Hello Meghani Watch Co., I am browsing your website and would like to speak with a concierge.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Tooltip Pill */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-[#181818]/95 backdrop-blur-md text-[#F5F0E6] text-xs py-2 px-3.5 rounded-full border border-[#C9A04F]/40 shadow-xl shadow-black/50 animate-fade-in-right">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Need help finding a timepiece? Concierge is online</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-[#8E877A] hover:text-white ml-1 p-0.5"
            aria-label="Dismiss tooltip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Meghani Watch Co. Concierge on WhatsApp"
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-2xl shadow-[#25D366]/30 hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-white/20 hover:ring-[#C9A04F]"
      >
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/20 animate-pulse-soft -z-10" />
        <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
      </a>
    </div>
  );
}

