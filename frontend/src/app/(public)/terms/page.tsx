import Breadcrumbs from '@/components/public/Breadcrumbs';
import { buildPageMetadata } from '@/utils/seo';
import { getStoreInfo } from '@/services/publicCatalogue';

export const metadata = buildPageMetadata({
  title: 'Terms of Service, Warranty & Showroom Policies',
  description:
    'Review purchase terms, official brand warranty coverage, showroom visit policies, and repair service terms at Meghani Watch Co. in Vadodara.',
  path: '/terms',
  keywords: [
    'Meghani Watch Co terms',
    'watch warranty policy Vadodara',
    'watch repair terms'
  ],
});

export default async function TermsPage() {
  const storeInfo = await getStoreInfo();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Terms & Conditions' }]} />

      <div className="py-8 border-b border-[#2A261F]">
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Store Policies & Warranty
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#F3EFE6]">
          Terms & Conditions
        </h1>
        <p className="text-xs text-[#8D8980] mt-2">
          Effective Date: January 1, 2026 • {storeInfo.name} Vadodara
        </p>
      </div>

      <div className="py-10 space-y-8 text-xs sm:text-sm text-[#8D8980] leading-relaxed">
        {storeInfo.terms_and_conditions && (
          <div className="p-4 rounded-xl bg-[#201D17] border border-[#C9A45C]/30 text-[#E8D5A7] text-xs leading-relaxed mb-6">
            <strong className="block text-[#C9A45C] uppercase tracking-wider mb-1">Official Boutique Policies</strong>
            {storeInfo.terms_and_conditions}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            1. 100% Genuine Watch Guarantee
          </h2>
          <p>
            All watches sold by Meghani Watch Co. are 100% brand new, authentic, and sourced directly from official brand partners (including Titan, Casio, Timex, and Citizen). Every purchase includes the official brand warranty card and GST invoice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            2. Product Pricing & Price on Request
          </h2>
          <p>
            Prices shown on our website include all applicable Indian taxes. For select watches marked as &ldquo;Price on Request&rdquo;, prices are provided directly upon enquiry via WhatsApp or phone. Meghani Watch Co. reserves the right to update product availability or prices according to official brand guidelines.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            3. Warranty Coverage & Watch Servicing
          </h2>
          <p>
            Manufacturer warranties cover internal movement defects and mechanism issues under normal usage for the duration stated (typically 12 to 24 months). Physical damage, scratches, unauthorized opening, or water damage beyond the rated specifications are subject to brand terms and repair estimates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-[#F3EFE6]">
            4. Showroom Visits & Enquiries
          </h2>
          <p>
            Showroom visits and enquiries scheduled via our website or WhatsApp are free of charge. Inquired watches can be set aside for you for up to 48 hours upon confirmation by our team.
          </p>
        </section>
      </div>
    </div>
  );
}
