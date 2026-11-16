import Breadcrumbs from '@/components/public/Breadcrumbs';

export const metadata = {
  title: 'Terms & Conditions — Meghani Watch Co.',
  description: 'Terms of service, warranty policy, and in-store viewing conditions at Meghani Watch Co.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Terms & Conditions' }]} />

      <div className="py-8 border-b border-[#221F18]">
        <span className="text-xs text-[#C9A04F] font-semibold uppercase tracking-[0.2em] block mb-2">
          Client Agreement & Warranties
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5F0E6]">
          Terms & Conditions
        </h1>
        <p className="text-xs text-[#8E877A] mt-2">
          Effective Date: January 1, 2026 • Meghani Watch Co. Ahmedabad
        </p>
      </div>

      <div className="py-10 space-y-8 text-xs sm:text-sm text-[#A8A194] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            1. Authorized Retailer Authenticity Guarantee
          </h2>
          <p>
            All timepieces presented by Meghani Watch Co. are 100% brand new, authentic, and sourced directly from official manufacturers (including Titan Company Limited, Casio Computer Co. Ltd, Timex Group, and Citizen Watch Co.). Every acquisition is accompanied by the official stamped manufacturer warranty booklet and tax invoice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            2. Catalogue Pricing & Price on Request
          </h2>
          <p>
            Prices published on our website are inclusive of all statutory Indian taxes. For timepieces marked as &ldquo;Price on Request&rdquo; or bespoke allocations, quotations are furnished on an individual client basis by our concierge and remain valid for 7 calendar days. Meghani Watch Co. reserves the right to modify catalogue listings, availability states, or retail prices in accordance with manufacturer tariff revisions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            3. Warranty Coverage & Atelier Servicing
          </h2>
          <p>
            Manufacturer warranties cover internal movement defects, hands, and dial mechanics under normal usage for the duration stated (typically 12 to 36 months). External damage resulting from accidental impact, unauthorized case opening, water ingress exceeding rated specifications, or strap wear is subject to manufacturer terms and atelier repair estimates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            4. In-Store Private Viewings
          </h2>
          <p>
            Scheduling an in-store private viewing does not obligate the client to acquire the timepiece. We hold requested timepieces for up to 24 hours from the agreed appointment time, after which they may be re-allocated to general salon inventory.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            5. Governing Law & Jurisdiction
          </h2>
          <p>
            Any disputes arising from purchases or servicing through Meghani Watch Co. shall be governed by the laws of India and subject to the exclusive jurisdiction of the competent courts in Ahmedabad, Gujarat.
          </p>
        </section>
      </div>
    </div>
  );
}

