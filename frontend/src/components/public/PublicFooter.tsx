import Link from 'next/link';
import Image from 'next/image';
import {
  Watch,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Wrench,
  Truck,
  ArrowUpRight,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { MEGHANI_STORE_INFO } from '@/services/publicCatalogue';
import { BusinessStoreInfo } from '@/types/public';

interface PublicFooterProps {
  storeInfo?: BusinessStoreInfo;
}

export default function PublicFooter({ storeInfo = MEGHANI_STORE_INFO }: PublicFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0B0B0A] text-[#8D8980] border-t border-[#1C1A15]">
      {/* Horological Trust Pillars */}
      <div className="border-b border-[#2A261F] py-12 px-4 sm:px-8 bg-[#171613]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#201D17] border border-[#C9A45C]/30 flex items-center justify-center shrink-0 text-[#C9A45C]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#F3EFE6] uppercase tracking-wider">
                100% Genuine Watches
              </h4>
              <p className="text-xs text-[#8D8980] mt-1.5 leading-relaxed font-sans">
                Authorized retail partner for Titan, Casio, Citizen, Timex and more, with official manufacturer warranty.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#201D17] border border-[#C9A45C]/30 flex items-center justify-center shrink-0 text-[#C9A45C]">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#F3EFE6] uppercase tracking-wider">
                Expert Watch Repair Workshop
              </h4>
              <p className="text-xs text-[#8D8980] mt-1.5 leading-relaxed font-sans">
                Experienced technicians for watch servicing, battery replacement, strap adjustments, and water resistance testing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#201D17] border border-[#C9A45C]/30 flex items-center justify-center shrink-0 text-[#C9A45C]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#F3EFE6] uppercase tracking-wider">
                Safe Packaging & Delivery
              </h4>
              <p className="text-xs text-[#8D8980] mt-1.5 leading-relaxed font-sans">
                Careful packaging, complimentary watch gift wrapping, strap sizing, and secure delivery across India.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#201D17] border border-[#C9A45C]/30 flex items-center justify-center shrink-0 text-[#C9A45C]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-medium text-[#F3EFE6] uppercase tracking-wider">
                Trusted Since 1984
              </h4>
              <p className="text-xs text-[#8D8980] mt-1.5 leading-relaxed font-sans">
                Over 40 years of service, customer trust, and watch expertise in Vadodara, Gujarat.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-full bg-[#1E1C17] border border-[#C9A45C]/40 flex items-center justify-center overflow-hidden p-0.5 shadow-md group-hover:border-[#C9A45C] transition-all">
                <Image
                  src="/images/gold-m-emblem.png"
                  alt="Meghani Watch Co."
                  width={44}
                  height={44}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-widest text-[#F3EFE6] uppercase block">
                  Meghani Watch Co.
                </span>
                <span className="text-[10px] text-[#C9A45C] tracking-[0.25em] uppercase font-semibold">
                  Timeless Style. Trusted Quality.
                </span>
              </div>
            </Link>

            <p className="text-xs text-[#8D8980] leading-relaxed max-w-sm pt-2 font-sans">
              Meghani Watch Co. is a trusted watch showroom and service center in Vadodara, Gujarat. Since 1984, we have provided genuine watches from top brands like Titan, Casio, Citizen, Timex, and Ajanta clocks with official warranties.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={`https://wa.me/${storeInfo.whatsapp}?text=${encodeURIComponent(
                  'Hello Meghani Watch Co., I would like to enquire about watches.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#1E1C17] text-[#C9A45C] border border-[#C9A45C]/30 hover:bg-[#C9A45C] hover:text-[#0B0B0A] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enquire on WhatsApp</span>
              </a>

              <a
                href={storeInfo.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8D8980] hover:text-[#F3EFE6] transition-colors"
              >
                <span>View on Maps</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C9A45C]" />
              </a>
            </div>
          </div>

          {/* Quick Links: Curations */}
          <div>
            <h5 className="font-serif text-xs font-semibold text-[#F3EFE6] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#C9A45C] pl-2.5">
              Shop Watches
            </h5>
            <ul className="space-y-2.5 text-xs text-[#8D8980]">
              <li>
                <Link href="/shop" className="hover:text-[#E8D5A7] transition-colors">
                  All Watches
                </Link>
              </li>
              <li>
                <Link href="/shop?category=analog" className="hover:text-[#E8D5A7] transition-colors">
                  Analog & Automatic Watches
                </Link>
              </li>
              <li>
                <Link href="/shop?category=digital" className="hover:text-[#E8D5A7] transition-colors">
                  Digital Watches & Chronographs
                </Link>
              </li>
              <li>
                <Link href="/shop?category=smart" className="hover:text-[#E8D5A7] transition-colors">
                  Smartwatches & Fitness Trackers
                </Link>
              </li>
              <li>
                <Link href="/shop?category=wall" className="hover:text-[#E8D5A7] transition-colors">
                  Wall Clocks & Pendulums
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accessory" className="hover:text-[#E8D5A7] transition-colors">
                  Watch Straps & Accessories
                </Link>
              </li>
              <li>
                <Link href="/offers" className="text-[#C9A45C] hover:underline font-medium">
                  Special Festive Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Heritage Brands */}
          <div>
            <h5 className="font-serif text-xs font-semibold text-[#F3EFE6] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#C9A45C] pl-2.5">
              Popular Watch Brands
            </h5>
            <ul className="space-y-2.5 text-xs text-[#8D8980]">
              <li>
                <Link href="/shop?brand=Titan" className="hover:text-[#E8D5A7] transition-colors">
                  Titan Edge & Regalia
                </Link>
              </li>
              <li>
                <Link href="/shop?brand=Casio" className="hover:text-[#E8D5A7] transition-colors">
                  Casio & G-Shock
                </Link>
              </li>
              <li>
                <Link href="/shop?brand=Timex" className="hover:text-[#E8D5A7] transition-colors">
                  Timex Automatic & Expedition
                </Link>
              </li>
              <li>
                <Link href="/shop?brand=Citizen" className="hover:text-[#E8D5A7] transition-colors">
                  Citizen Eco-Drive Solar
                </Link>
              </li>
              <li>
                <Link href="/shop?brand=Fastrack" className="hover:text-[#E8D5A7] transition-colors">
                  Fastrack Youth Watches
                </Link>
              </li>
              <li>
                <Link href="/shop?brand=Sonata" className="hover:text-[#E8D5A7] transition-colors">
                  Sonata Everyday Watches
                </Link>
              </li>
              <li>
                <Link href="/brands" className="text-[#C9A45C] hover:underline font-medium">
                  Explore All Brands
                </Link>
              </li>
            </ul>
          </div>

          {/* Boutique Visit & Contact */}
          <div>
            <h5 className="font-serif text-xs font-semibold text-[#F3EFE6] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#C9A45C] pl-2.5">
              Visit Our Showroom
            </h5>
            <div className="space-y-3 text-xs text-[#8D8980]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {storeInfo.address.line1}, {storeInfo.address.line2}, {storeInfo.address.city} – {storeInfo.address.pincode}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#C9A45C] shrink-0" />
                <p>{storeInfo.hours.weekdays}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C9A45C] shrink-0" />
                <a href={`tel:${storeInfo.phone}`} className="hover:text-[#E8D5A7]">
                  {storeInfo.phone}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C9A45C] shrink-0" />
                <a href={`mailto:${storeInfo.email}`} className="hover:text-[#E8D5A7]">
                  {storeInfo.email}
                </a>
              </div>

              <div className="pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs text-[#C9A45C] hover:text-[#E8D5A7] font-semibold"
                >
                  <span>Visit Our Vadodara Showroom</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Attribution */}
      <div className="border-t border-[#1C1A15] bg-[#070706] py-6 px-4 sm:px-8 text-xs text-[#6E6960]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 1984–{currentYear} Meghani Watch Co. All rights reserved. Timeless Style. Trusted Quality.</p>

          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-[#F3EFE6] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#F3EFE6] transition-colors">
              Terms & Conditions
            </Link>
            <Link
              href="/login"
              className="text-[#8D8980] hover:text-[#C9A45C] transition-colors flex items-center gap-1"
            >
              <span>Staff Portal (Connect 360)</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

