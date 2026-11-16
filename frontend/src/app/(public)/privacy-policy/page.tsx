import Breadcrumbs from '@/components/public/Breadcrumbs';
import { buildPageMetadata } from '@/utils/seo';
import { getStoreInfo } from '@/services/publicCatalogue';

export const metadata = buildPageMetadata({
  title: 'Client Privacy Policy & Customer Data Protection',
  description:
    'Learn about customer data privacy, information security, and confidentiality at Meghani Watch Co. in Vadodara.',
  path: '/privacy-policy',
  keywords: [
    'Meghani Watch Co privacy policy',
    'customer privacy Vadodara',
    'watch purchase privacy'
  ],
});

export default async function PrivacyPolicyPage() {
  const storeInfo = await getStoreInfo();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="py-8 border-b border-[#2A261F]">
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Customer Privacy & Trust
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#F3EFE6]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#8D8980] mt-2">
          Effective Date: January 1, 2026 • {storeInfo.name} Vadodara
        </p>
      </div>

      <div className="py-10 space-y-8 text-xs sm:text-sm text-[#8D8980] leading-relaxed">
        {storeInfo.privacy_policy && (
          <div className="p-4 rounded-xl bg-[#201D17] border border-[#C9A45C]/30 text-[#E8D5A7] text-xs leading-relaxed mb-6">
            <strong className="block text-[#C9A45C] uppercase tracking-wider mb-1">Official Privacy Commitment</strong>
            {storeInfo.privacy_policy}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            1. Our Commitment to Your Privacy
          </h2>
          <p>
            At Meghani Watch Co., we take customer privacy seriously. This policy explains what information we collect when you use our website, enquire via WhatsApp, or visit our Vadodara showroom, and how that information is used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            2. Information We Collect
          </h2>
          <p>
            We only collect the details needed to assist you with watch purchases and warranty service:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#C0B9AC]">
            <li>Name, phone number, and email address when you submit an enquiry or request a showroom visit.</li>
            <li>Watch preferences, budget, or preferred brands (such as Titan, Casio, Citizen, or Timex).</li>
            <li>Purchase details and warranty cards for after-sales servicing and repairs.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            3. How We Use Your Information
          </h2>
          <p>
            Your information is used only to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#C0B9AC]">
            <li>Respond to your watch enquiries and confirm showroom visits.</li>
            <li>Help with official brand warranty registration where applicable.</li>
            <li>Maintain service and repair history for watches brought to our workshop.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            4. Protection of Your Information
          </h2>
          <p>
            We do not sell, rent, or trade your personal information with third parties. Your details are accessed only by authorized store staff to assist with your watch requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            5. Contact Us
          </h2>
          <p>
            If you have questions about our privacy policy or want to update your details, please email us at <a href="mailto:contact@meghaniwatch.com" className="text-[#C9A45C] underline">contact@meghaniwatch.com</a> or call +91 91066 80191.
          </p>
        </section>
      </div>
    </div>
  );
}
