import Breadcrumbs from '@/components/public/Breadcrumbs';
import { buildPageMetadata } from '@/utils/seo';

export const metadata = buildPageMetadata({
  title: 'Client Privacy Policy & Data Protection',
  description:
    'Learn about client data confidentiality, personal information security, and privacy governance at Meghani Watch Co. in Vadodara.',
  path: '/privacy-policy',
  keywords: [
    'Meghani Watch Co privacy policy',
    'client data confidentiality',
    'watch purchase privacy'
  ],
});

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="py-8 border-b border-[#2A261F]">
        <span className="text-xs text-[#C9A45C] font-semibold uppercase tracking-[0.25em] block mb-2">
          Legal & Data Governance
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#F3EFE6]">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#8D8980] mt-2">
          Effective Date: January 1, 2026 • Meghani Watch Co. Vadodara
        </p>
      </div>

      <div className="py-10 space-y-8 text-xs sm:text-sm text-[#8D8980] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            1. Our Commitment to Client Confidentiality
          </h2>
          <p>
            At Meghani Watch Co., we hold the confidentiality and privacy of our clientele in the highest regard. This policy outlines how we collect, handle, and safeguard personal information provided through our website, WhatsApp concierge channel, and in-store salon consultations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            2. Information We Collect
          </h2>
          <p>
            We collect only the information necessary to provide tailored timepiece consultation and fulfill warranty obligations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#C0B9AC]">
            <li>Contact details such as your name, phone number, and email address when scheduling private viewings or submitting watch inquiries.</li>
            <li>Timepiece preferences, desired models, budget parameters, and commemorative dates (e.g. wedding anniversaries).</li>
            <li>Purchase history, serial numbers, and warranty certificates for after-sales servicing.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            3. How We Use Client Information
          </h2>
          <p>
            Client records are used strictly for:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#C0B9AC]">
            <li>Personalized concierge communications regarding timepiece availability, allocations, and service progress.</li>
            <li>Registration of official brand warranties with Titan, Casio, Citizen, and Timex.</li>
            <li>Maintaining archival service logs for watches submitted to our master atelier.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            4. Absolute Non-Disclosure & Third-Party Protection
          </h2>
          <p>
            We never sell, rent, lease, or monetize client data under any circumstances. Personal records are accessed solely by authorized boutique staff and our in-house horological management system (Meghani Connect 360).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E6]">
            5. Contacting Our Data Concierge
          </h2>
          <p>
            If you wish to review, update, or remove your personal information from our consultation records, please contact our concierge at <a href="mailto:concierge@meghaniwatch.com" className="text-[#C9A45C] underline">concierge@meghaniwatch.com</a> or call +91 91066 80191.
          </p>
        </section>
      </div>
    </div>
  );
}
