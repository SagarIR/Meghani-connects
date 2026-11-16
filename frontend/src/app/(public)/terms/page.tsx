import Breadcrumbs from '@/components/public/Breadcrumbs';
import { buildPageMetadata } from '@/utils/seo';

export const metadata = buildPageMetadata({
  title: 'Terms of Service, Warranty & Atelier Conditions',
  description:
    'Review client purchase terms, manufacturer warranty coverage, in-store viewing policies, and atelier repair terms at Meghani Watch Co. in Vadodara.',
  path: '/terms',
  keywords: [
    'Meghani Watch Co terms',
    'watch warranty policy Vadodara',
    'atelier repair terms'
  ],
});

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Terms & Conditions' }]} />

      <div className="py-8 border-b border-[#2A261F]">
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Client Agreement & Warranties
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#F3EFE6]">
          Terms & Conditions
        </h1>
        <p className="text-xs text-[#8D8980] mt-2">
          Effective Date: January 1, 2026 • Meghani Watch Co. Vadodara
        </p>
      </div>

      <div className="py-10 space-y-8 text-xs sm:text-sm text-[#8D8980] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            1. Authorized Retailer Authenticity Guarantee
          </h2>
          <p>
            All timepieces presented by Meghani Watch Co. are 100% brand new, authentic, and sourced directly from official manufacturers (including Titan Company Limited, Casio Computer Co. Ltd, Timex Group, and Citizen Watch Co.). Every acquisition is accompanied by the official stamped manufacturer warranty booklet and tax invoice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            2. Catalogue Pricing & Price on Request
          </h2>
          <p>
            Prices published on our website are inclusive of all statutory Indian taxes. For timepieces marked as &ldquo;Price on Request&rdquo; or bespoke allocations, quotations are furnished on an individual client basis by our concierge and remain valid for 7 calendar days. Meghani Watch Co. reserves the right to modify catalogue listings, availability states, or retail prices in accordance with manufacturer tariff revisions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            3. Warranty Coverage & Atelier Servicing
          </h2>
          <p>
            Manufacturer warranties cover internal movement defects, hands, and dial mechanics under normal usage for the duration stated (typically 12 to 36 months). External damage resulting from accidental impact, unauthorized case opening, water ingress exceeding rated specifications, or strap wear is subject to manufacturer terms and atelier repair estimates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            4. Boutique Reservations & Consultations
          </h2>
          <p>
            Private salon viewings and appointments scheduled through our digital portal or WhatsApp concierge are complimentary. Allocated timepieces can be reserved for up to 48 hours upon confirmation by our concierge team.
          </p>
        </section>
      </div>
    </div>
  );
}
